import pool from '@/lib/db';
import { json, fail, withAuth } from '@/lib/server';

// Detail satu transaksi lengkap dengan barang-barangnya (untuk struk)
export const GET = withAuth(async ({ params }) => {
  try {
    const { id } = params;

    const [trxRows] = await pool.query(
      `SELECT 
        t.*,
        u.username as kasir_username,
        u.nama_lengkap as kasir_nama,
        m.nama as member_nama,
        m.no_hp as member_hp,
        m.alamat as member_alamat
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN members m ON t.member_id = m.id
      WHERE t.id = ? OR t.invoice_no = ?`,
      [id, id]
    );

    if (trxRows.length === 0) {
      return fail('Transaksi tidak ditemukan.', 404);
    }

    const transaction = trxRows[0];

    const [items] = await pool.query(
      `SELECT 
        td.id,
        td.product_id,
        td.jumlah,
        td.harga,
        td.subtotal,
        p.barcode,
        p.nama_barang,
        p.satuan,
        p.kategori
      FROM transaction_details td
      JOIN products p ON td.product_id = p.id
      WHERE td.transaction_id = ?`,
      [transaction.id]
    );

    return json({ success: true, data: { ...transaction, items } });
  } catch (error) {
    console.error('Error getTransactionById:', error);
    return fail('Gagal mengambil detail transaksi.', 500);
  }
});
