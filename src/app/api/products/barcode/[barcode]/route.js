import pool from '@/lib/db';
import { json, fail, withAuth } from '@/lib/server';

// Cari produk berdasarkan barcode (Kasir POS / Scanner)
export const GET = withAuth(async ({ params }) => {
  try {
    const { barcode } = params;

    if (!barcode) {
      return fail('Barcode tidak boleh kosong.', 400);
    }

    const [rows] = await pool.query('SELECT * FROM products WHERE barcode = ?', [
      decodeURIComponent(barcode).trim(),
    ]);

    if (rows.length === 0) {
      return fail('Barang dengan barcode tersebut tidak ditemukan.', 404);
    }

    return json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error getProductByBarcode:', error);
    return fail('Gagal mencari barang berdasarkan barcode.', 500);
  }
});
