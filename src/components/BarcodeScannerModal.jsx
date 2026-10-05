'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, Scan, AlertCircle, RefreshCw, Keyboard } from 'lucide-react';

export const BarcodeScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen) {
      setErrorMessage('');
      setManualCode('');

      // Beri sedikit delay agar DOM element #reader sudah ter-render sempurna
      const timer = setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: { width: 250, height: 180 },
            aspectRatio: 1.0,
          };

          html5QrCode
            .start(
              { facingMode: 'environment' },
              config,
              (decodedText) => {
                // Berhasil scan barcode
                handleSuccess(decodedText);
              },
              (errorMessage) => {
                // Abaikan error per-frame scanning rutin
              }
            )
            .then(() => {
              setIsScanning(true);
            })
            .catch((err) => {
              console.warn('Kamera tidak dapat diakses:', err);
              setIsScanning(false);
              setErrorMessage('Kamera tidak dapat diakses atau izin ditolak. Anda dapat memasukkan barcode secara manual.');
            });
        } catch (err) {
          console.error('Inisialisasi scanner gagal:', err);
          setIsScanning(false);
          setErrorMessage('Scanner kamera tidak tersedia di browser ini.');
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current
            .stop()
            .then(() => scannerRef.current.clear())
            .catch((e) => console.log('Error stopping scanner:', e));
        }
      };
    }
  }, [isOpen]);

  const handleSuccess = (code) => {
    // Bunyi audio beep simulasi scanner kasir supermarket
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 1800; // Nada beep tinggi khas kasir
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // AudioContext mungkin diblokir browser jika belum interaksi
    }

    onScanSuccess(code);
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100">
        {/* Header Modal */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="font-bold text-base">Scan Barcode Barang</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scanner */}
        <div className="p-4 flex flex-col items-center">
          {/* Viewport Kamera */}
          <div className="w-full relative bg-slate-950 rounded-xl overflow-hidden min-h-[260px] flex items-center justify-center">
            <div id="qr-reader" className="w-full"></div>

            {/* Panduan Scanning Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-60 h-36 border-2 border-dashed border-indigo-400/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-500"></div>
                <div className="w-full h-0.5 bg-red-500/80 shadow-[0_0_8px_red] absolute top-1/2 -translate-y-1/2 animate-bounce"></div>
              </div>
              <p className="text-xs text-white/90 bg-slate-900/80 px-3 py-1 rounded-full mt-3 font-medium">
                Arahkan barcode ke dalam kotak
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2 w-full">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Fallback Input Barcode Manual */}
          <form onSubmit={handleManualSubmit} className="mt-4 w-full">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-indigo-600" />
              Atau Input Barcode Manual:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ketik barcode di sini lalu tekan Enter..."
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition"
              >
                Cari
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-xl transition"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
