'use client';

import React, { useEffect, useState } from 'react';
import { api, formatRupiah, formatDate } from '@/lib/api';
import { ReceiptModal } from '@/components/ReceiptModal';
import { 
  ReceiptText, 
  Search, 
  Calendar, 
  Eye, 
  Printer, 
  Filter 
} from 'lucide-react';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal Detail Struk
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions', {
        search,
        startDate,
        endDate,
      });
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, startDate, endDate]);

  const handleViewReceipt = async (trx) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/transactions/${trx.id}`);
      setSelectedTransaction(res.data);
      setIsReceiptOpen(true);
    } catch (err) {
      alert('Gagal mengambil rincian struk: ' + err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <ReceiptText className="w-7 h-7 text-indigo-600" />
          Data Riwayat Transaksi Kasir
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Daftar seluruh transaksi penjualan yang telah diproses oleh petugas kasir.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari invoice, kasir, atau member..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Dari:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <div className="text-xs text-slate-500">Sampai:</div>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-rose-600 hover:underline font-semibold ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">No. Invoice</th>
                <th className="py-3.5 px-4">Tanggal & Jam</th>
                <th className="py-3.5 px-4">Kasir</th>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4 text-center">Jml Barang</th>
                <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                <th className="py-3.5 px-4 text-right">Bayar</th>
                <th className="py-3.5 px-4 text-right">Kembalian</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    Memuat data transaksi...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-indigo-600">
                      {trx.invoice_no}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDate(trx.tanggal_transaksi)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                      {trx.kasir_nama || trx.kasir_username}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {trx.member_nama ? (
                        <span className="font-medium text-slate-800">{trx.member_nama}</span>
                      ) : (
                        <span className="text-slate-400 italic">Non-Member</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700">
                      {trx.total_qty || trx.total_item || 1} pcs
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-xs">
                      {formatRupiah(trx.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-600">
                      {formatRupiah(trx.bayar)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-emerald-600 font-semibold">
                      {formatRupiah(trx.kembalian)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleViewReceipt(trx)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Struk
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400 text-sm">
                    Tidak ada data transaksi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cetak Struk */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default TransactionsPage;
