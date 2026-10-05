import pool from '@/lib/db';
import { json, fail, withAuth } from '@/lib/server';

// Riwayat log perubahan stok (Admin)
export const GET = withAuth(
  async ({ request }) => {
    try {
      const productId = request.nextUrl.searchParams.get('productId');

      let query = `
        SELECT sl.*, p.nama_barang, p.barcode, u.username as admin_username, u.nama_lengkap as admin_nama
        FROM stock_logs sl
        JOIN products p ON sl.product_id = p.id
        JOIN users u ON sl.user_id = u.id
      `;
      const params = [];

      if (productId) {
        query += ' WHERE sl.product_id = ?';
        params.push(productId);
      }

      query += ' ORDER BY sl.created_at DESC LIMIT 100';

      const [logs] = await pool.query(query, params);
      return json({ success: true, data: logs });
    } catch (error) {
      console.error('Error getStockLogs:', error);
      return fail('Gagal mengambil riwayat perubahan stok.', 500);
    }
  },
  { role: 'admin' }
);
