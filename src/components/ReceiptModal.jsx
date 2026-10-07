'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { Printer, CheckCircle, X, Store, Receipt } from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/api';

export const ReceiptModal = ({ isOpen, onClose, transaction }) => {
  useEffect(() => {
    if (isOpen) {
      // Pemicu animasi confetti selebrasi pembayaran sukses
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      // Penanda untuk CSS print: sembunyikan semua selain struk
      document.body.classList.add('printing-receipt');
    }
    return () => document.body.classList.remove('printing-receipt');
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    const el = document.getElementById('printable-receipt');
    // Hitung tinggi struk (px -> mm) supaya ukuran kertas pas dengan isi struk
    const heightMm = el ? Math.ceil((el.scrollHeight * 25.4) / 96) + 10 : 200;

    const style = document.createElement('style');
    style.innerHTML = `@page { size: 80mm ${heightMm}mm; margin: 0; }`;
    document.head.appendChild(style);

    window.print();
    setTimeout(() => style.remove(), 1000);
  };

  const {
    invoice_no,
    tanggal,
    tanggal_transaksi,
    kasir,
    kasir_nama,
    kasir_username,
    member,
    member_nama,
    items,
    total,
    bayar,
    kembalian,
  } = transaction;

  const cashierDisplay = kasir?.nama_lengkap || kasir_nama || kasir?.username || kasir_username || 'Petugas Kasir';
  const memberDisplay = member?.nama || member_nama || 'Umum (Non-Member)';
  const trxDate = tanggal || tanggal_transaksi || new Date();

  return createPortal(
    <div className="receipt-portal fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="receipt-card bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-emerald-600 p-4 text-white flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">Transaksi Berhasil!</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="receipt-scroll p-6 overflow-y-auto bg-slate-100/60 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-xs text-slate-800"
          >
            {/* Toko Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-center gap-1 font-bold text-base text-slate-900">
                <Store className="w-4 h-4 text-indigo-600 inline no-print" />
                POS TOKO SMK SEJAHTERA
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Jl. Pendidikan No. 108, Denpasar, Bali
              </p>
              <p className="text-[11px] text-slate-500">Telp: 0812-3456-7890</p>
            </div>

            {/* Info Transaksi */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Invoice:</span>
                <span className="font-bold text-slate-800">{invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span>{formatDate(trxDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span className="font-medium">{cashierDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-medium">{memberDisplay}</span>
              </div>
            </div>

            {/* Daftar Barang */}
            <div className="py-2.5 border-b border-dashed border-slate-300">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex justify-between">
                <span>Item</span>
                <span>Subtotal</span>
              </div>
              <div className="space-y-2">
                {items &&
                  items.map((item, index) => (
                    <div key={index} className="text-[11px]">
                      <div className="font-medium text-slate-900 truncate">
                        {item.nama_barang}
                      </div>
                      <div className="flex justify-between text-slate-500 text-[10px]">
                        <span>
                          {item.jumlah} x {formatRupiah(item.harga)}
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Rincian Pembayaran */}
            <div className="pt-2.5 pb-1 space-y-1 text-[11px]">
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                <span>TOTAL:</span>
                <span className="text-indigo-600">{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tunai / Bayar:</span>
                <span className="font-semibold">{formatRupiah(bayar)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Kembalian:</span>
                <span>{formatRupiah(kembalian)}</span>
              </div>
            </div>

            {/* Footer Struk */}
            <div className="text-center pt-4 mt-2 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">*** TERIMA KASIH ***</p>
              <p>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
              <p className="text-[9px] text-slate-400">Powered by Aplikasi POS SMK</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="bg-white p-4 border-t border-slate-100 flex items-center justify-between gap-3 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Tutup & Transaksi Baru
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};