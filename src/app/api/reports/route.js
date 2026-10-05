import pool from '@/lib/db';
import { json, fail, withAuth } from '@/lib/server';

// Laporan transaksi dengan filter waktu (Admin & Petugas)
export const GET = withAuth(async ({ request }) => {
  try {
    const sp = request.nextUrl.searchParams;
    const period = sp.get('period');
    const startDate = sp.get('startDate');
    const endDate = sp.get('endDate');

    let dateCondition = '';
    const params = [];

    if (period === 'today') {
      dateCondition = ' AND DATE(t.tanggal_transaksi) = CURDATE()';
    } else if (period === 'this_week') {
      dateCondition = ' AND YEARWEEK(t.tanggal_transaksi, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (period === 'this_month') {
      dateCondition =
        ' AND MONTH(t.tanggal_transaksi) = MONTH(CURDATE()) AND YEAR(t.tanggal_transaksi) = YEAR(CURDATE())';
    } else if (period === 'custom' && startDate && endDate) {
      dateCondition = ' AND DATE(t.tanggal_transaksi) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const query = `
      SELECT 
        t.id,
        t.invoice_no,
        t.total,
        t.bayar,
        t.kembalian,
        t.tanggal_transaksi,
        u.username as petugas_username,
        u.nama_lengkap as petugas_nama,
        COALESCE(m.nama, 'Umum / Non-Member') as member_nama,
        COALESCE(m.no_hp, '-') as member_hp,
        COUNT(td.id) as total_item,
        COALESCE(SUM(td.jumlah), 0) as total_pcs
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN members m ON t.member_id = m.id
      LEFT JOIN transaction_details td ON t.id = td.transaction_id
      WHERE 1=1 ${dateCondition}
      GROUP BY t.id
      ORDER BY t.tanggal_transaksi DESC
    `;

    const [transactions] = await pool.query(query, params);

    let totalPendapatan = 0;
    let totalBarangTerjual = 0;
    const totalTransaksi = transactions.length;

    transactions.forEach((trx) => {
      totalPendapatan += Number(trx.total) || 0;
      totalBarangTerjual += Number(trx.total_pcs) || 0;
    });

    const rataRataTransaksi = totalTransaksi > 0 ? totalPendapatan / totalTransaksi : 0;

    return json({
      success: true,
      period: period || 'all',
      summary: { totalPendapatan, totalTransaksi, totalBarangTerjual, rataRataTransaksi },
      data: transactions,
    });
  } catch (error) {
    console.error('Error getReport:', error);
    return fail('Gagal mengambil data laporan.', 500);
  }
});
