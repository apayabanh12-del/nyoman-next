'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart,
  LayoutDashboard,
  FileText,
  LogOut,
  User,
  ShieldCheck,
  Store
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, isAdmin, isPetugas } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link href={isAdmin ? "/admin/dashboard" : "/kasir"} className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  POS KASIR
                </span>
                <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  SMK
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links for quick access */}
          <nav className="hidden md:flex items-center space-x-1">
            {isAdmin && (
              <>
                <Link
                  href="/admin/dashboard"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname.startsWith('/admin')
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard Admin
                </Link>
                <Link
                  href="/admin/reports"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === '/admin/reports'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  Laporan
                </Link>
              </>
            )}

            {isPetugas && (
              <>
                <Link
                  href="/kasir"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === '/kasir'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Menu Kasir (POS)
                </Link>
                <Link
                  href="/kasir/reports"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${pathname === '/kasir/reports'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  Laporan Transaksi
                </Link>
              </>
            )}
          </nav>

          {/* Right User Badge & Logout */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <User className="w-5 h-5" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.nama_lengkap || user.username}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-bold uppercase tracking-wider ${isAdmin
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                  >
                    <ShieldCheck className="w-3 h-3 mr-0.5" />
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 text-sm font-medium ml-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
