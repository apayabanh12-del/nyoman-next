'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api, formatRupiah } from '@/lib/api';
import { BarcodeScannerModal } from '@/components/BarcodeScannerModal';
import { ReceiptModal } from '@/components/ReceiptModal';
import { 
  Scan, 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  User, 
  UserPlus, 
  CreditCard, 
  Package,
  Layers,
  Clock,
  X
} from 'lucide-react';

const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Keranjang Belanja
  const [cart, setCart] = useState([]);

  // Barcode Input
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef(null);

  // Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Member State
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberForm, setNewMemberForm] = useState({ nama: '', no_hp: '', alamat: '' });

  // Pembayaran & Cash
  const [cashGiven, setCashGiven] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Alert State
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }

  // Struk Modal
  const [completedTransaction, setCompletedTransaction] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Live Clock
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Produk & Member
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resProd, resMemb] = await Promise.all([
        api.get('/products'),
        api.get('/members'),
      ]);
      setProducts(resProd.data || []);
      setCategories(['Semua', ...(resProd.categories || [])]);
      setMembers(resMemb.data || []);
    } catch (err) {
      showAlert('error', err.message || 'Gagal memuat data kasir.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4500);
  };

  // Tambah barang ke keranjang
  const addToCart = (product) => {
    // Cek ketersediaan stok
    const existingIndex = cart.findIndex((item) => item.id === product.id);
    const currentQtyInCart = existingIndex > -1 ? cart[existingIndex].qty : 0;

    if (currentQtyInCart + 1 > product.stok) {
      showAlert('error', `Stok barang tidak mencukupi. Sisa stok "${product.nama_barang}": ${product.stok}`);
      return;
    }

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].qty += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          barcode: product.barcode,
          nama_barang: product.nama_barang,
          harga: Number(product.harga),
          stok: product.stok,
          satuan: product.satuan,
          qty: 1,
        },
      ]);
    }
  };

  // Update quantity barang di keranjang
  const updateQty = (productId, newQty) => {
    const productInDB = products.find((p) => p.id === productId);
    if (!productInDB) return;

    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQty > productInDB.stok) {
      showAlert('error', `Stok barang tidak mencukupi. Sisa stok: ${productInDB.stok}`);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, qty: newQty } : item
      )
    );
  };

  // Hapus 1 barang dari keranjang
  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  // Reset seluruh keranjang
  const handleResetCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Kosongkan semua barang di keranjang belanja?')) {
      setCart([]);
      setCashGiven('');
      setSelectedMemberId('');
      showAlert('success', 'Keranjang kasir telah direset.');
    }
  };

  // Handle Scan / Input Barcode Manual
  const handleBarcodeSubmit = (e) => {
    e?.preventDefault();
    if (!barcodeInput.trim()) return;

    handleBarcodeFound(barcodeInput.trim());
    setBarcodeInput('');
  };

  const handleBarcodeFound = async (barcode) => {
    try {
      const res = await api.get(`/products/barcode/${barcode}`);
      if (res.success && res.data) {
        addToCart(res.data);
      }
    } catch (err) {
      showAlert('error', err.message || `Barang dengan barcode "${barcode}" tidak ditemukan.`);
    }
  };

  // Tambah Member Baru Langsung dari Kasir
  const handleAddNewMember = async (e) => {
    e.preventDefault();
    if (!newMemberForm.nama || !newMemberForm.no_hp) {
      showAlert('error', 'Nama dan No HP member wajib diisi!');
      return;
    }

    try {
      const res = await api.post('/members', newMemberForm);
      showAlert('success', `Member "${res.data.nama}" berhasil didaftarkan!`);
      setMembers([...members, res.data]);
      setSelectedMemberId(res.data.id);
      setIsAddMemberModalOpen(false);
      setNewMemberForm({ nama: '', no_hp: '', alamat: '' });
    } catch (err) {
      showAlert('error', err.message || 'Gagal mendaftarkan member.');
    }
  };

  // Kalkulasi Total Belanja
  const totalAmount = cart.reduce((acc, item) => acc + item.harga * item.qty, 0);
  const numCash = Number(cashGiven) || 0;
  const changeAmount = numCash >= totalAmount ? numCash - totalAmount : 0;
  const isCashEnough = numCash >= totalAmount && totalAmount > 0;

  // Checkout Transaksi
  const handlePayment = async () => {
    if (cart.length === 0) {
      showAlert('error', 'Keranjang belanja masih kosong!');
      return;
    }

    if (!isCashEnough) {
      showAlert('error', 'Uang pembayaran belum mencukupi total belanja!');
      return;
    }

    try {
      setPaymentLoading(true);
      const payload = {
        items: cart.map((item) => ({
          id: item.id,
          product_id: item.id,
          jumlah: item.qty,
        })),
        member_id: selectedMemberId ? Number(selectedMemberId) : null,
        bayar: numCash,
      };

      const res = await api.post('/transactions', payload);

      if (res.success) {
        setCompletedTransaction(res.data);
        setIsReceiptOpen(true);
        // Kosongkan keranjang & refresh data stok terbaru
        setCart([]);
        setCashGiven('');
        setSelectedMemberId('');
        fetchData();
      }
    } catch (err) {
      showAlert('error', err.message || 'Gagal memproses transaksi kasir.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Filter Produk di Katalog
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Semua' || p.kategori === selectedCategory;
    const matchesSearch =
      p.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-100/70 p-4 sm:p-6 lg:p-8">
      {/* Floating Top Alert */}
      {alert && (
        <div
          className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all max-w-md ${
            alert.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      )}

      {/* POS Top Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Scan & Barcode Input */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-200 transition shrink-0 cursor-pointer"
          >
            <Scan className="w-4 h-4 animate-pulse" />
            <span>Scan Kamera</span>
          </button>

          <form onSubmit={handleBarcodeSubmit} className="flex-1 flex gap-2">
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan barcode scanner atau ketik lalu tekan Enter..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Enter
            </button>
          </form>
        </div>

        {/* Member Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <User className="w-4 h-4 text-indigo-600 shrink-0" />
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer max-w-[150px] sm:max-w-[200px]"
            >
              <option value="">-- Non-Member (Umum) --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama} ({m.no_hp})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsAddMemberModalOpen(true)}
            title="Daftar Member Baru"
            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {/* Jam Real-time */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            {time.toLocaleTimeString('id-ID')}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Catalog, Right Cart */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: KATALOG BARANG (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Pills */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama barang atau barcode di katalog..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[620px] overflow-y-auto pr-1">
            {loading ? (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Memuat barang dagangan...
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((p) => {
                const isOutOfStock = p.stok <= 0;
                return (
                  <button
                    key={p.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(p)}
                    className={`bg-white rounded-2xl p-3.5 border text-left flex flex-col justify-between transition group relative overflow-hidden cursor-pointer ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50'
                        : 'border-slate-200/80 hover:border-indigo-400 hover:shadow-md hover:scale-[1.01]'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {p.kategori}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : p.stok <= 10
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          Stok: {p.stok}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-800 mt-2 line-clamp-2 group-hover:text-indigo-600 transition">
                        {p.nama_barang}
                      </h4>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {p.barcode}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">
                        {formatRupiah(p.harga)}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 flex items-center justify-center transition">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
                Barang tidak ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: KERANJANG & PEMBAYARAN (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-lg flex flex-col justify-between min-h-[600px] sticky top-20">
          <div>
            {/* Header Keranjang */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">Keranjang Kasir</h3>
                  <p className="text-[11px] text-slate-500">
                    {cart.length} jenis item ({cart.reduce((a, b) => a + b.qty, 0)} pcs)
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetCart}
                  className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* List Barang di Keranjang */}
            <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto my-3 pr-1">
              {cart.length > 0 ? (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">
                        {item.nama_barang}
                      </h5>
                      <p className="text-[11px] text-slate-500">
                        {formatRupiah(item.harga)} / {item.satuan}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        max={item.stok}
                        value={item.qty}
                        onChange={(e) => updateQty(item.id, Number(e.target.value))}
                        className="w-10 text-center py-0.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right w-20">
                      <span className="font-extrabold text-xs text-slate-900 block">
                        {formatRupiah(item.harga * item.qty)}
                      </span>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Keranjang kosong. Pilih barang dari katalog atau scan barcode.
                </div>
              )}
            </div>
          </div>

          {/* Bagian Perhitungan & Pembayaran */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* Total Display */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-4 text-white">
              <span className="text-xs uppercase font-semibold text-indigo-300">
                Total Tagihan:
              </span>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                {formatRupiah(totalAmount)}
              </div>
            </div>

            {/* Quick Cash Buttons */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Uang Cepat (Quick Cash):
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCashGiven(totalAmount)}
                  className="py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-bold text-slate-700 transition cursor-pointer"
                >
                  Uang Pas
                </button>
                <button
                  type="button"
                  onClick={() => setCashGiven(10000)}
                  className="py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-bold text-slate-700 transition cursor-pointer"
                >
                  Rp 10.000
                </button>
                <button
                  type="button"
                  onClick={() => setCashGiven(20000)}
                  className="py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-bold text-slate-700 transition cursor-pointer"
                >
                  Rp 20.000
                </button>
                <button
                  type="button"
                  onClick={() => setCashGiven(50000)}
                  className="py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-bold text-slate-700 transition cursor-pointer"
                >
                  Rp 50.000
                </button>
                <button
                  type="button"
                  onClick={() => setCashGiven(100000)}
                  className="py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-bold text-slate-700 transition cursor-pointer"
                >
                  Rp 100.000
                </button>
                <button
                  type="button"
                  onClick={() => setCashGiven(200000)}
                  className="py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg font-bold text-slate-700 transition cursor-pointer"
                >
                  Rp 200.000
                </button>
              </div>
            </div>

            {/* Input Nominal Bayar & Realtime Kembalian */}
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nominal Pembayaran (Tunai):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 text-base font-extrabold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Status Kembalian */}
              {totalAmount > 0 && numCash > 0 && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex justify-between items-center border ${
                    isCashEnough
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <span>{isCashEnough ? 'Kembalian:' : 'Uang Kurang:'}</span>
                  <span className="text-sm font-extrabold">
                    {isCashEnough
                      ? formatRupiah(changeAmount)
                      : formatRupiah(totalAmount - numCash)}
                  </span>
                </div>
              )}
            </div>

            {/* Tombol Bayar */}
            <button
              type="button"
              disabled={paymentLoading || !isCashEnough || cart.length === 0}
              onClick={handlePayment}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {paymentLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Proses Pembayaran (Bayar)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Scanner Barcode Kamera */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeFound}
      />

      {/* Modal Cetak Struk Hasil Pembayaran */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={completedTransaction}
      />

      {/* Modal Tambah Member Cepat */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                Daftar Member Pelanggan Baru
              </h3>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewMember} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Member *
                </label>
                <input
                  type="text"
                  value={newMemberForm.nama}
                  onChange={(e) =>
                    setNewMemberForm({ ...newMemberForm, nama: e.target.value })
                  }
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP (WhatsApp) *
                </label>
                <input
                  type="text"
                  value={newMemberForm.no_hp}
                  onChange={(e) =>
                    setNewMemberForm({ ...newMemberForm, no_hp: e.target.value })
                  }
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat (Opsional)
                </label>
                <input
                  type="text"
                  value={newMemberForm.alamat}
                  onChange={(e) =>
                    setNewMemberForm({ ...newMemberForm, alamat: e.target.value })
                  }
                  placeholder="Denpasar, Bali"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition"
                >
                  Simpan & Pilih
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosPage;
