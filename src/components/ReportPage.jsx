'use client';

import React, { useState, useEffect } from 'react';
import { api, formatRupiah, formatDate } from '@/lib/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  TrendingUp, 
  ShoppingBag, 
  CreditCard,
  DollarSign
} from 'lucide-react';

const ReportPage = () => {
  const [period, setPeriod] = useState('today'); // 'today' | 'this_week' | 'this_month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState({
    summary: {
      totalPendapatan: 0,
      totalTransaksi: 0,
      totalBarangTerjual: 0,
      rataRataTransaksi: 0,
    },
    data: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = { period };
      if (period === 'custom') {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      const res = await api.get('/reports', params);
      setReportData(res);
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleApplyCustomFilter = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert('Pilih tanggal awal dan akhir untuk filter custom!');
      return;
    }
    fetchReport();
  };

  // Cetak Laporan (Window Print)
  const handlePrint = () => {
    window.print();
  };

  // Download Laporan Format PDF menggunakan jsPDF + AutoTable
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Judul Dokumen PDF
    doc.setFontSize(16);
    doc.setTextColor(30, 27, 75);
    doc.text('LAPORAN PENJUALAN TRANSAKSI KASIR POS', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Periode: ${getPeriodLabel()}`, 14, 25);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 30);

    // Ringkasan KPI di PDF
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 34, 182, 22, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`Total Omset: ${formatRupiah(reportData.summary.totalPendapatan)}`, 18, 42);
    doc.text(`Total Transaksi: ${reportData.summary.totalTransaksi} transaksi`, 18, 50);
    doc.text(`Total Item Terjual: ${reportData.summary.totalBarangTerjual} pcs`, 110, 42);
    doc.text(`Rata-rata Transaksi: ${formatRupiah(reportData.summary.rataRataTransaksi)}`, 110, 50);

    // Tabel Transaksi
    const tableRows = reportData.data.map((trx, index) => [
      index + 1,
      trx.invoice_no,
      formatDate(trx.tanggal_transaksi),
      trx.petugas_nama || trx.petugas_username,
      trx.member_nama,
      `${trx.total_pcs || 1} pcs`,
      formatRupiah(trx.total),
      'Tunai (Lunas)',
    ]);

    autoTable(doc, {
      startY: 62,
      head: [['No', 'Invoice', 'Tanggal & Waktu', 'Petugas', 'Member', 'Qty', 'Total', 'Status']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        6: { halign: 'right', fontStyle: 'bold' },
        5: { halign: 'center' },
      },
    });

    doc.save(`Laporan_Kasir_${period}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return 'Hari Ini';
      case 'this_week':
        return 'Minggu Ini';
      case 'this_month':
        return 'Bulan Ini';
      case 'custom':
        return `${startDate || '?'} s/d ${endDate || '?'}`;
      default:
        return 'Semua';
    }
  };

  return (
    <div className="space-y-6">
      {/* Printable Report Wrapper for Window Print */}
      <div id="printable-report" className="hidden print:block">
        <div className="text-center pb-4 border-b border-slate-300">
          <h1 className="text-xl font-bold">LAPORAN TRANSAKSI PENJUALAN KASIR</h1>
          <p className="text-sm text-slate-600">POS TOKO SMK SEJAHTERA</p>
          <p className="text-xs text-slate-500">
            Periode: {getPeriodLabel()} | Tanggal Cetak: {new Date().toLocaleString('id-ID')}
          </p>
        </div>

        <div className="my-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <p><strong>Total Omset:</strong> {formatRupiah(reportData.summary.totalPendapatan)}</p>
            <p><strong>Total Transaksi:</strong> {reportData.summary.totalTransaksi} transaksi</p>
          </div>
          <div>
            <p><strong>Barang Terjual:</strong> {reportData.summary.totalBarangTerjual} pcs</p>
            <p><strong>Rata-rata Belanja:</strong> {formatRupiah(reportData.summary.rataRataTransaksi)}</p>
          </div>
        </div>

        <table className="w-full text-left text-xs border border-collapse border-slate-300">
          <thead>
            <tr className="bg-slate-100">
              <th className="border p-2">Invoice</th>
              <th className="border p-2">Tanggal</th>
              <th className="border p-2">Petugas</th>
              <th className="border p-2">Member</th>
              <th className="border p-2 text-right">Total</th>
              <th className="border p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {reportData.data.map((t) => (
              <tr key={t.id}>
                <td className="border p-2 font-mono">{t.invoice_no}</td>
                <td className="border p-2">{formatDate(t.tanggal_transaksi)}</td>
                <td className="border p-2">{t.petugas_nama}</td>
                <td className="border p-2">{t.member_nama}</td>
                <td className="border p-2 text-right font-bold">{formatRupiah(t.total)}</td>
                <td className="border p-2 text-center">Lunas</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Screen View */}
      <div className="no-print space-y-6">
        {/* Header & Export Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileText className="w-7 h-7 text-indigo-600" />
              Laporan Penjualan Transaksi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Rekapitulasi penjualan toko, pendapatan kasir, dan riwayat transaksi dengan filter waktu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Laporan
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Preset Period Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                period === 'today'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriod('this_week')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                period === 'this_week'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setPeriod('this_month')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                period === 'this_month'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                period === 'custom'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Custom Tanggal
            </button>
          </div>

          {/* Custom Date Form */}
          {period === 'custom' && (
            <form onSubmit={handleApplyCustomFilter} className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Terapkan
              </button>
            </form>
          )}
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
              <span>Total Omset</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mt-2">
              {formatRupiah(reportData.summary.totalPendapatan)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Periode: {getPeriodLabel()}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
              <span>Total Transaksi</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mt-2">
              {reportData.summary.totalTransaksi} Trx
            </h3>
            <p className="text-xs text-slate-400 mt-1">Jumlah nota transaksi</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
              <span>Barang Terjual</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mt-2">
              {reportData.summary.totalBarangTerjual} Unit
            </h3>
            <p className="text-xs text-slate-400 mt-1">Akumulasi pcs terjual</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase">
              <span>Rata-Rata Transaksi</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mt-2">
              {formatRupiah(reportData.summary.rataRataTransaksi)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">Nilai per struk</p>
          </div>
        </div>

        {/* Detailed Transactions Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-base text-slate-800">
              Rincian Daftar Transaksi ({getPeriodLabel()})
            </h3>
            <span className="text-xs text-slate-500">
              Ditemukan {reportData.data.length} transaksi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">No. Transaksi</th>
                  <th className="py-3 px-4">Tanggal & Waktu</th>
                  <th className="py-3 px-4">Petugas Kasir</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4 text-center">Jumlah Barang</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Status Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400">
                      Memuat laporan transaksi...
                    </td>
                  </tr>
                ) : reportData.data.length > 0 ? (
                  reportData.data.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600">
                        {trx.invoice_no}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {formatDate(trx.tanggal_transaksi)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                        {trx.petugas_nama || trx.petugas_username}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {trx.member_nama}
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs font-medium text-slate-700">
                        {trx.total_pcs || 1} pcs
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 text-xs">
                        {formatRupiah(trx.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                          Tunai - Lunas
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-slate-400 text-sm">
                      Tidak ada transaksi pada periode {getPeriodLabel()}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
