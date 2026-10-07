'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Printer, CheckCircle, X, Store } from 'lucide-react';
import { formatRupiah, formatDate } from '@/lib/api';

const escapeHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

export const ReceiptModal = ({ isOpen, onClose, transaction }) => {
  useEffect(() => {
    if (isOpen) {
      // Pemicu animasi confetti selebrasi pembayaran sukses
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

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

  const handlePrint = () => {
    const rows = (items || [])
      .map(
        (item) => `
        <div class="item">
          <div class="name">${escapeHtml(item.nama_barang)}</div>
          <div class="row">
            <span>${escapeHtml(item.jumlah)} x ${escapeHtml(formatRupiah(item.harga))}</span>
            <span>${escapeHtml(formatRupiah(item.subtotal))}</span>
          </div>
        </div>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Struk ${escapeHtml(invoice_no)}</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    width: 80mm;
    padding: 4mm;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #000;
  }
  .center { text-align: center; }
  .title { font-weight: bold; font-size: 14px; }
  .small { font-size: 11px; }
  .dash { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .bold { font-weight: bold; }
  .total { font-size: 14px; font-weight: bold; }
  .item { margin-bottom: 6px; }
  .name { font-weight: bold; word-break: break-word; }
  .head { font-size: 10px; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="center">
    <div class="title">POS TOKO SMK SEJAHTERA</div>
    <div class="small">Jl. Pendidikan No. 108, Denpasar, Bali</div>
    <div class="small">Telp: 0812-3456-7890</div>
  </div>
  <div class="dash"></div>

  <div class="small">
    <div class="row"><span>No. Invoice:</span><span class="bold">${escapeHtml(invoice_no)}</span></div>
    <div class="row"><span>Tanggal:</span><span>${escapeHtml(formatDate(trxDate))}</span></div>
    <div class="row"><span>Kasir:</span><span>${escapeHtml(cashierDisplay)}</span></div>
    <div class="row"><span>Pelanggan:</span><span>${escapeHtml(memberDisplay)}</span></div>
  </div>
  <div class="dash"></div>

  <div class="row head"><span>Item</span><span>Subtotal</span></div>
  <div style="margin-top:4px">${rows}</div>
  <div class="dash"></div>

  <div class="row total"><span>TOTAL:</span><span>${escapeHtml(formatRupiah(total))}</span></div>
  <div class="row small"><span>Tunai / Bayar:</span><span>${escapeHtml(formatRupiah(bayar))}</span></div>
  <div class="row small bold"><span>Kembalian:</span><span>${escapeHtml(formatRupiah(kembalian))}</span></div>
  <div class="dash"></div>

  <div class="center small">
    <div class="bold">*** TERIMA KASIH ***</div>
    <div>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</div>
    <div style="font-size:9px;margin-top:4px">Powered by Aplikasi POS SMK</div>
  </div>
</body>
</html>`;

    // Iframe tersembunyi khusus untuk cetak struk
    const iframe = document.createElement('iframe');
    iframe.style.cssText =
      'position:fixed;left:-9999px;top:0;width:400px;height:800px;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      // Hitung tinggi struk (px -> mm) supaya kertas pas, tidak ada sisa kosong
      const heightMm = Math.ceil((doc.body.scrollHeight * 25.4) / 96) + 4;
      const style = doc.createElement('style');
      style.textContent = `@page { size: 80mm ${heightMm}mm; margin: 0; }`;
      doc.head.appendChild(style);

      win.onafterprint = () => iframe.remove();
      win.focus();
      win.print();

      // Cadangan kalau afterprint tidak terpanggil
      setTimeout(() => iframe.remove(), 120000);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
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

        {/* Scrollable Receipt Body (tampilan di layar) */}
        <div className="p-6 overflow-y-auto bg-slate-100/60 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-[340px] bg-white p-5 rounded-lg shadow-sm border border-slate-200 font-mono text-xs text-slate-800"
          >
            {/* Toko Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="flex items-center justify-center gap-1 font-bold text-base text-slate-900">
                <Store className="w-4 h-4 text-indigo-600 inline" />
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
        <div className="bg-white p-4 border-t border-slate-100 flex items-center justify-between gap-3">
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
    </div>
  );
};