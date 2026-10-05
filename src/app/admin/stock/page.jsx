'use client';

import React, { useEffect, useState } from 'react';
import { api, formatDate } from '@/lib/api';
import { 
  Layers, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Check, 
  AlertCircle, 
  Clock, 
  Package, 
  FileText
} from 'lucide-react';

const StockUpdatePage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [tipe, setTipe] = useState('masuk'); // 'masuk' | 'keluar'
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);
  const [stockLogs, setStockLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Alert State
  const [alert, setAlert] = useState(null);

  const fetchProductsAndLogs = async () => {
    try {
      const [resProd, resLogs] = await Promise.all([
        api.get('/products'),
        api.get('/products/logs/stock')
      ]);
      setProducts(resProd.data || []);
      setStockLogs(resLogs.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndLogs();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const currentStock = selectedProduct ? Number(selectedProduct.stok) : 0;
  const numJumlah = Number(jumlah) || 0;

  // Hitung proyeksi stok baru
  let projectedStock = currentStock;
  let isMinus = false;
  if (tipe === 'masuk') {
    projectedStock = currentStock + numJumlah;
  } else {
    projectedStock = currentStock - numJumlah;
    if (projectedStock < 0) {
      isMinus = true;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProductId) {
      showAlert('error', 'Silakan pilih barang terlebih dahulu!');
      return;
    }

    if (numJumlah <= 0) {
      showAlert('error', 'Jumlah stok harus lebih dari 0!');
      return;
    }

    if (tipe === 'keluar' && isMinus) {
      showAlert('error', `Gagal! Pengurangan menyebabkan stok minus. Sisa stok ${currentStock}, diminta keluar ${numJumlah}.`);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/products/${selectedProductId}/stock`, {
        tipe,
        jumlah: numJumlah,
        keterangan: keterangan.trim() || (tipe === 'masuk' ? 'Penambahan stok fisik' : 'Pengurangan stok fisik')
      });

      showAlert('success', res.message || 'Stok berhasil diperbarui!');
      setJumlah('');
      setKeterangan('');
      fetchProductsAndLogs();
    } catch (err) {
      showAlert('error', err.message || 'Gagal memperbarui stok.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Layers className="w-7 h-7 text-indigo-600" />
          Manajemen & Update Stok Barang
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Perbarui jumlah stok masuk (kulakan) atau keluar (rusak/retur). Dilengkapi pencegah stok minus otomatis.
        </p>
      </div>

      {/* Floating Alert */}
      {alert && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 transition-all ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {alert.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{alert.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Update Stok */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm h-fit">
          <h2 className="font-bold text-base text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-600" />
            Form Penyesuaian Stok
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pilih Barang */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pilih Barang *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                required
              >
                <option value="">-- Pilih Barang Dagangan --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama_barang} (Stok: {p.stok} {p.satuan})
                  </option>
                ))}
              </select>
            </div>

            {/* Info Kartu Barang yang Dipilih */}
            {selectedProduct && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Barcode:</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedProduct.barcode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stok Saat Ini:</span>
                  <span className="font-bold text-indigo-600">
                    {selectedProduct.stok} {selectedProduct.satuan}
                  </span>
                </div>
              </div>
            )}

            {/* Tipe Penyesuaian: Masuk atau Keluar */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jenis Perubahan *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipe('masuk')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    tipe === 'masuk'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                  Stok Masuk (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTipe('keluar')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    tipe === 'keluar'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                  Stok Keluar (-)
                </button>
              </div>
            </div>

            {/* Jumlah */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jumlah Penyesuaian *
              </label>
              <input
                type="number"
                min="1"
                value={jumlah}
                onChange={(e) => setJumlah(e.target.value)}
                placeholder="Contoh: 10"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-bold text-slate-800"
                required
              />
            </div>

            {/* Live Kalkulasi Stok */}
            {selectedProduct && numJumlah > 0 && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  isMinus
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>Proyeksi Stok Akhir:</span>
                  <span className="font-extrabold text-sm">
                    {currentStock} {tipe === 'masuk' ? '+' : '-'} {numJumlah} = {projectedStock} {selectedProduct.satuan}
                  </span>
                </div>
                {isMinus && (
                  <p className="mt-1 text-[11px] text-rose-600 font-bold">
                    ⚠️ Pengurangan menyebabkan stok minus! Dilarang menyimpan.
                  </p>
                )}
              </div>
            )}

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Keterangan / Alasan
              </label>
              <textarea
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Kulakan suplier Indomarco, retur barang kemasan rusak, dll."
                rows="3"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedProductId || numJumlah <= 0 || isMinus}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-200 transition cursor-pointer"
            >
              {loading ? 'Menyimpan...' : 'Simpan Perubahan Stok'}
            </button>
          </form>
        </div>

        {/* Tabel Log Riwayat Perubahan Stok */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-base text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Riwayat Log Perubahan Stok
                </h2>
                <p className="text-xs text-slate-500">
                  Daftar rekam jejak setiap penambahan atau pengurangan stok oleh Admin
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-3">Waktu</th>
                    <th className="py-3 px-3">Barang</th>
                    <th className="py-3 px-3 text-center">Tipe</th>
                    <th className="py-3 px-3 text-right">Jumlah</th>
                    <th className="py-3 px-3 text-center">Sebelum &rarr; Sesudah</th>
                    <th className="py-3 px-3">Keterangan</th>
                    <th className="py-3 px-3">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logsLoading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-400">
                        Memuat riwayat log...
                      </td>
                    </tr>
                  ) : stockLogs.length > 0 ? (
                    stockLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {log.nama_barang}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              log.tipe === 'masuk'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {log.tipe === 'masuk' ? 'MASUK (+)' : 'KELUAR (-)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">
                          {log.jumlah}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-mono">
                          {log.stok_sebelum} &rarr; <strong className="text-slate-900">{log.stok_sesudah}</strong>
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-[150px] truncate" title={log.keterangan}>
                          {log.keterangan || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {log.admin_nama || log.admin_username}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-slate-400">
                        Belum ada riwayat penyesuaian stok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockUpdatePage;
