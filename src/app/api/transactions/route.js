import pool from '@/lib/db';
import { json, fail, readBody, withAuth } from '@/lib/server';

// Nomor struk/invoice unik dan teratur
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${year}${month}${day}-${random}`;
};

// Semua transaksi (Admin & Petugas)
export const GET = withAuth(async ({ request }) => {
  try {
    const sp = request.nextUrl.searchParams;
    const search = sp.get('search');
    const startDate = sp.get('startDate');
    const endDate = sp.get('endDate');
    const limit = sp.get('limit');

    let query = `
      SELECT 
        t.id,
        t.invoice_no,
        t.total,
        t.bayar,
        t.kembalian,
        t.tanggal_transaksi,
        u.id as user_id,
        u.username as kasir_username,
        u.nama_lengkap as kasir_nama,
        m.id as member_id,
        m.nama as member_nama,
        m.no_hp as member_hp,
        COUNT(td.id) as total_item,
        SUM(td.jumlah) as total_qty
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN members m ON t.member_id = m.id
      LEFT JOIN transaction_details td ON t.id = td.transaction_id
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim() !== '') {
      query += ` AND (t.invoice_no LIKE ? OR u.nama_lengkap LIKE ? OR m.nama LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    if (startDate) {
      query += ` AND DATE(t.tanggal_transaksi) >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND DATE(t.tanggal_transaksi) <= ?`;
      params.push(endDate);
    }

    query += ` GROUP BY t.id ORDER BY t.tanggal_transaksi DESC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(Number(limit));
    }

    const [rows] = await pool.query(query, params);
    return json({ success: true, data: rows });
  } catch (error) {
    console.error('Error getAllTransactions:', error);
    return fail('Gagal mengambil riwayat transaksi.', 500);
  }
});

// Checkout / pembayaran kasir (HANYA PETUGAS). Pakai transaksi DB (ACID) supaya stok aman.
export const POST = withAuth(
  async ({ request, user }) => {
    const connection = await pool.getConnection();

    try {
      const { items, member_id, bayar } = await readBody(request);

      if (!items || !Array.isArray(items) || items.length === 0) {
        return fail('Keranjang belanja kosong! Silakan tambahkan barang terlebih dahulu.', 400);
      }

      const numBayar = Number(bayar);
      if (isNaN(numBayar) || numBayar <= 0) {
        return fail('Nominal pembayaran tidak valid.', 400);
      }

      await connection.beginTransaction();

      let calculatedTotal = 0;
      const processedItems = [];

      for (const item of items) {
        const productId = item.id || item.product_id;
        const qty = Number(item.jumlah || item.qty);

        if (!productId || isNaN(qty) || qty <= 0) {
          await connection.rollback();
          return fail('Data barang di keranjang tidak valid.', 400);
        }

        // Lock row produk
        const [products] = await connection.query(
          'SELECT id, barcode, nama_barang, harga, stok, satuan FROM products WHERE id = ? FOR UPDATE',
          [productId]
        );

        if (products.length === 0) {
          await connection.rollback();
          return fail(`Barang dengan ID ${productId} tidak ditemukan.`, 404);
        }

        const product = products[0];

        if (product.stok < qty) {
          await connection.rollback();
          return fail(
            `Stok barang "${product.nama_barang}" tidak mencukupi! Sisa stok: ${product.stok}, diminta: ${qty}.`,
            400
          );
        }

        const itemPrice = Number(product.harga);
        const subtotal = itemPrice * qty;
        calculatedTotal += subtotal;

        processedItems.push({
          product_id: product.id,
          nama_barang: product.nama_barang,
          barcode: product.barcode,
          satuan: product.satuan,
          jumlah: qty,
          harga: itemPrice,
          subtotal,
        });
      }

      if (numBayar < calculatedTotal) {
        await connection.rollback();
        return fail(
          `Uang bayar tidak mencukupi! Total belanja Rp ${calculatedTotal.toLocaleString('id-ID')}, uang yang dibayar Rp ${numBayar.toLocaleString('id-ID')}.`,
          400
        );
      }

      const kembalian = numBayar - calculatedTotal;
      const invoiceNo = generateInvoiceNumber();

      const [trxResult] = await connection.query(
        `INSERT INTO transactions (invoice_no, user_id, member_id, total, bayar, kembalian, tanggal_transaksi)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [invoiceNo, user.id, member_id ? Number(member_id) : null, calculatedTotal, numBayar, kembalian]
      );

      const transactionId = trxResult.insertId;

      for (const item of processedItems) {
        await connection.query(
          `INSERT INTO transaction_details (transaction_id, product_id, jumlah, harga, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [transactionId, item.product_id, item.jumlah, item.harga, item.subtotal]
        );

        await connection.query('UPDATE products SET stok = stok - ? WHERE id = ?', [
          item.jumlah,
          item.product_id,
        ]);
      }

      await connection.commit();

      let memberData = null;
      if (member_id) {
        const [members] = await pool.query('SELECT * FROM members WHERE id = ?', [member_id]);
        if (members.length > 0) memberData = members[0];
      }

      const receipt = {
        id: transactionId,
        invoice_no: invoiceNo,
        tanggal: new Date(),
        kasir: {
          id: user.id,
          username: user.username,
          nama_lengkap: user.nama_lengkap,
        },
        member: memberData
          ? { id: memberData.id, nama: memberData.nama, no_hp: memberData.no_hp }
          : null,
        items: processedItems,
        total: calculatedTotal,
        bayar: numBayar,
        kembalian,
      };

      return json({ success: true, message: 'Transaksi berhasil disimpan!', data: receipt }, 201);
    } catch (error) {
      await connection.rollback();
      console.error('Error createTransaction:', error);
      return fail('Terjadi kesalahan sistem saat memproses transaksi.', 500);
    } finally {
      connection.release();
    }
  },
  { role: 'petugas' }
);
