'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, formatRupiah, formatDate } from '@/lib/api';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  AlertTriangle, 
  ArrowRight, 
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setData(res);
    } catch (err) {
      setError(err.message || 'Gagal memuat statistik dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Memuat data dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
        {error}
      </div>
    );
  }

  const { stats, lowStockProducts, recentTransactions, salesChart } = data || {};

  // Kalkulasi persentase tinggi bar chart
  const maxSales = Math.max(...(salesChart?.map(s => Number(s.total_omset)) || [1]), 100000);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Utama Administrator
          </h1>
          <p className="text-indigo-100 text-sm mt-1 max-w-xl">
            Pantau arus kas penjualan toko, pantau ketersediaan stok barang secara real-time, dan kelola operasional kasir dengan mudah.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/admin/stock"
            className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4" />
            Update Stok
          </Link>
          <Link
            href="/laporan"
            className="px-4 py-2.5 bg-indigo-800/80 hover:bg-indigo-800 text-white font-semibold rounded-xl text-sm transition border border-indigo-500/50 flex items-center gap-1.5"
          >
            Lihat Laporan
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Omset Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Omset Hari Ini
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {formatRupiah(stats?.omsetHariIni || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Dari <strong>{stats?.transaksiHariIni || 0}</strong> transaksi hari ini
            </p>
          </div>
        </div>

        {/* Card 2: Total Omset Keseluruhan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Omset Toko
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {formatRupiah(stats?.totalOmset || 0)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Total <strong>{stats?.totalTransaksi || 0}</strong> transaksi tersimpan
            </p>
          </div>
        </div>

        {/* Card 3: Total Produk & Stok */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Barang & Stok
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {stats?.totalBarang || 0} Produk
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Total <strong>{stats?.totalStok || 0}</strong> unit persediaan fisik
            </p>
          </div>
        </div>

        {/* Card 4: Total Member */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Member Terdaftar
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {stats?.totalMember || 0} Orang
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pelanggan aktif anggota toko
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Grafik Penjualan & Alert Stok Menipis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Penjualan 7 Hari Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  Tren Penjualan 7 Hari Terakhir
                </h3>
                <p className="text-xs text-slate-500">Omset harian hasil transaksi kasir</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg">
                Grafik Harian
              </span>
            </div>

            {/* Visual Bar Chart */}
            {salesChart && salesChart.length > 0 ? (
              <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-4 px-2 border-b border-slate-100">
                {salesChart.map((s, idx) => {
                  const heightPercent = Math.max(Math.round((Number(s.total_omset) / maxSales) * 100), 8);
                  const dateLabel = new Date(s.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-10 shadow-lg">
                        {formatRupiah(s.total_omset)} ({s.jumlah_transaksi} trx)
                      </div>
                      
                      {/* Bar Column */}
                      <div 
                        className="w-full max-w-[45px] bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg group-hover:from-indigo-700 group-hover:to-indigo-500 transition-all shadow-sm"
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                      
                      {/* Date Label */}
                      <span className="text-[11px] font-medium text-slate-500 truncate w-full text-center">
                        {dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
                Belum ada data penjualan 7 hari terakhir
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Rata-rata Penjualan Stabil</span>
            <Link href="/laporan" className="text-indigo-600 font-semibold hover:underline flex items-center gap-1">
              Buka Laporan Lengkap <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Peringatan Stok Menipis (Stok <= 10) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Stok Menipis</h3>
                  <p className="text-xs text-slate-500">Sisa stok 10 unit atau kurang</p>
                </div>
              </div>
            </div>

            {lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[170px]">
                        {p.nama_barang}
                      </p>
                      <p className="text-[10px] text-slate-400">Barcode: {p.barcode}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        p.stok === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.stok} {p.satuan}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Semua stok barang dalam kondisi aman (&gt; 10 unit)
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/admin/stock"
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              Tambah / Update Stok Sekarang
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-base text-slate-800">Transaksi Terbaru</h3>
            <p className="text-xs text-slate-500">5 transaksi kasir yang baru saja diproses</p>
          </div>
          <Link
            href="/admin/transactions"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
          >
            Lihat Semua Transaksi
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">No. Invoice</th>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Kasir</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Total Belanja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-indigo-600">
                      {trx.invoice_no}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {formatDate(trx.tanggal_transaksi)}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-800">
                      {trx.kasir_nama}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {trx.member_nama}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-900 text-right">
                      {formatRupiah(trx.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-xs text-slate-400">
                    Belum ada riwayat transaksi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
