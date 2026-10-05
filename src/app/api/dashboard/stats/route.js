import pool from '@/lib/db';
import { json, fail, withAuth } from '@/lib/server';

// Ringkasan statistik dashboard (Admin)
export const GET = withAuth(
  async () => {
    try {
      const [revAll] = await pool.query(
        'SELECT COALESCE(SUM(total), 0) as total_omset, COUNT(*) as total_transaksi FROM transactions'
      );
      const [revToday] = await pool.query(
        'SELECT COALESCE(SUM(total), 0) as omset_hari_ini, COUNT(*) as transaksi_hari_ini FROM transactions WHERE DATE(tanggal_transaksi) = CURDATE()'
      );
      const [prodStats] = await pool.query(
        'SELECT COUNT(*) as total_barang, COALESCE(SUM(stok), 0) as total_stok FROM products'
      );
      const [memberStats] = await pool.query(
        'SELECT COUNT(*) as total_member FROM members'
      );

      const [lowStock] = await pool.query(
        'SELECT id, barcode, nama_barang, stok, satuan, harga FROM products WHERE stok <= 10 ORDER BY stok ASC LIMIT 10'
      );

      const [recentTransactions] = await pool.query(`
        SELECT 
          t.id,
          t.invoice_no,
          t.total,
          t.tanggal_transaksi,
          u.nama_lengkap as kasir_nama,
          COALESCE(m.nama, 'Umum') as member_nama
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN members m ON t.member_id = m.id
        ORDER BY t.tanggal_transaksi DESC
        LIMIT 6
      `);

      const [salesChart] = await pool.query(`
        SELECT 
          DATE(tanggal_transaksi) as tanggal,
          COUNT(*) as jumlah_transaksi,
          COALESCE(SUM(total), 0) as total_omset
        FROM transactions
        WHERE tanggal_transaksi >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(tanggal_transaksi)
        ORDER BY DATE(tanggal_transaksi) ASC
      `);

      return json({
        success: true,
        stats: {
          totalOmset: Number(revAll[0].total_omset),
          totalTransaksi: Number(revAll[0].total_transaksi),
          omsetHariIni: Number(revToday[0].omset_hari_ini),
          transaksiHariIni: Number(revToday[0].transaksi_hari_ini),
          totalBarang: Number(prodStats[0].total_barang),
          totalStok: Number(prodStats[0].total_stok),
          totalMember: Number(memberStats[0].total_member),
        },
        lowStockProducts: lowStock,
        recentTransactions,
        salesChart,
      });
    } catch (error) {
      console.error('Error getDashboardStats:', error);
      return fail('Gagal mengambil statistik dashboard.', 500);
    }
  },
  { role: 'admin' }
);
