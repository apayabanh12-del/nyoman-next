'use client';

import React, { useEffect, useState } from 'react';
import { api, formatDate } from '@/lib/api';
import { UserCog, Plus, Search, X, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

const emptyForm = { nama_lengkap: '', username: '', password: '', confirmPassword: '' };

const PetugasPage = () => {
  const [petugas, setPetugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const fetchPetugas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/petugas', { search });
      setPetugas(res.data || []);
    } catch (err) {
      showAlert('error', err.message || 'Gagal memuat data petugas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetugas();
  }, [search]);

  const handleOpenModal = () => {
    setFormData(emptyForm);
    setFormError('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const { nama_lengkap, username, password, confirmPassword } = formData;

    if (!nama_lengkap.trim() || !username.trim() || !password) {
      setFormError('Semua kolom wajib diisi!');
      return;
    }
    if (username.trim().length < 3) {
      setFormError('Username minimal 3 karakter!');
      return;
    }
    if (password.length < 6) {
      setFormError('Password minimal 6 karakter!');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Konfirmasi password tidak cocok!');
      return;
    }

    try {
      setSaving(true);
      const res = await api.post('/petugas', {
        nama_lengkap: nama_lengkap.trim(),
        username: username.trim(),
        password,
      });
      setIsModalOpen(false);
      showAlert('success', res.message || 'Petugas berhasil didaftarkan!');
      fetchPetugas();
    } catch (err) {
      setFormError(err.message || 'Gagal mendaftarkan petugas.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none';
  const labelClass = 'block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCog className="w-7 h-7 text-indigo-600" />
            Data Petugas Kasir
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Akun petugas hanya bisa dibuat oleh Admin. Berikan username dan password ke petugas
            yang bersangkutan.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Daftarkan Petugas Baru
        </button>
      </div>

      {/* Alert */}
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

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan nama atau username..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Nama Lengkap</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Tanggal Dibuat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400">
                    Memuat data petugas...
                  </td>
                </tr>
              ) : petugas.length > 0 ? (
                petugas.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">#{p.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          {p.nama_lengkap?.charAt(0)?.toUpperCase() || 'P'}
                        </div>
                        <span className="font-semibold text-slate-800">{p.nama_lengkap}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{p.username}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                        {p.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{formatDate(p.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 text-sm">
                    Belum ada akun petugas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Petugas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-400" />
                Daftarkan Petugas Baru
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl text-xs bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{formError}</span>
                </div>
              )}

              <div>
                <label className={labelClass}>Nama Lengkap *</label>
                <input
                  type="text"
                  name="nama_lengkap"
                  value={formData.nama_lengkap}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div>
                <label className={labelClass}>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Minimal 3 karakter"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimal 6 karakter"
                    autoComplete="new-password"
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Konfirmasi Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  className={inputClass}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Petugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetugasPage;
