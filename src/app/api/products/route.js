import pool from '@/lib/db';
import { json, fail, readBody, withAuth } from '@/lib/server';

// Semua produk (Admin & Petugas)
export const GET = withAuth(async ({ request }) => {
  try {
    const sp = request.nextUrl.searchParams;
    const search = sp.get('search');
    const kategori = sp.get('kategori');

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search && search.trim() !== '') {
      query += ' AND (nama_barang LIKE ? OR barcode LIKE ? OR kategori LIKE ?)';
      const keyword = `%${search.trim()}%`;
      params.push(keyword, keyword, keyword);
    }

    if (kategori && kategori.trim() !== '' && kategori !== 'Semua') {
      query += ' AND kategori = ?';
      params.push(kategori.trim());
    }

    query += ' ORDER BY nama_barang ASC';

    const [products] = await pool.query(query, params);

    const [kategoriList] = await pool.query(
      'SELECT DISTINCT kategori FROM products WHERE kategori IS NOT NULL AND kategori != "" ORDER BY kategori ASC'
    );

    return json({
      success: true,
      data: products,
      categories: kategoriList.map((k) => k.kategori),
    });
  } catch (error) {
    console.error('Error getProducts:', error);
    return fail('Gagal mengambil data produk.', 500);
  }
});

// Tambah produk baru (HANYA ADMIN)
export const POST = withAuth(
  async ({ request, user }) => {
    try {
      const { barcode, nama_barang, harga, stok, kategori, satuan } = await readBody(request);

      if (!barcode || !nama_barang || harga === undefined || stok === undefined) {
        return fail('Barcode, nama barang, harga, dan stok wajib diisi!', 400);
      }

      const numHarga = Number(harga);
      const numStok = Number(stok);

      if (isNaN(numHarga) || numHarga < 0) {
        return fail('Harga harus berupa angka dan tidak boleh minus.', 400);
      }

      if (isNaN(numStok) || numStok < 0) {
        return fail('Stok harus berupa angka dan tidak boleh minus.', 400);
      }

      const [existing] = await pool.query('SELECT id FROM products WHERE barcode = ?', [
        barcode.trim(),
      ]);

      if (existing.length > 0) {
        return fail(`Barcode "${barcode.trim()}" sudah digunakan oleh barang lain!`, 400);
      }

      const [result] = await pool.query(
        'INSERT INTO products (barcode, nama_barang, harga, stok, kategori, satuan) VALUES (?, ?, ?, ?, ?, ?)',
        [
          barcode.trim(),
          nama_barang.trim(),
          numHarga,
          numStok,
          (kategori || 'Umum').trim(),
          (satuan || 'Pcs').trim(),
        ]
      );

      // Jika stok awal > 0, catat di stock_logs
      if (numStok > 0) {
        await pool.query(
          'INSERT INTO stock_logs (product_id, user_id, tipe, jumlah, stok_sebelum, stok_sesudah, keterangan) VALUES (?, ?, "masuk", ?, 0, ?, ?)',
          [result.insertId, user.id, numStok, numStok, 'Stok awal produk baru']
        );
      }

      return json(
        {
          success: true,
          message: 'Produk berhasil ditambahkan!',
          productId: result.insertId,
        },
        201
      );
    } catch (error) {
      console.error('Error createProduct:', error);
      return fail('Terjadi kesalahan saat menambah produk.', 500);
    }
  },
  { role: 'admin' }
);
