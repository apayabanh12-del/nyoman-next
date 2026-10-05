'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  UserCog,
  ReceiptText,
  FileText,
  LogOut,
  Store
} from 'lucide-react';

export const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/products', icon: Package, label: 'Data Barang' },
    { to: '/admin/stock', icon: Layers, label: 'Update Stok' },
    { to: '/admin/members', icon: Users, label: 'Data Member' },
    { to: '/admin/petugas', icon: UserCog, label: 'Data Petugas' },
    { to: '/admin/transactions', icon: ReceiptText, label: 'Data Transaksi' },
    { to: '/admin/reports', icon: FileText, label: 'Laporan' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shadow-xl border-r border-slate-800 shrink-0 no-print">
      <div>
        {/* Profile Card in Sidebar */}
        <div className="bg-slate-800/80 rounded-xl p-3 mb-6 border border-slate-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow">
            {user?.nama_lengkap?.charAt(0) || 'A'}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{user?.nama_lengkap}</h4>
            <p className="text-xs text-indigo-400 capitalize font-medium">{user?.role} Administrator</p>
          </div>
        </div>

        {/* Menu Title */}
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Menu Utama Admin
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${pathname === item.to
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom section with Logout */}
      <div className="pt-4 border-t border-slate-800 space-y-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-600/20 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Keluar (Logout)</span>
        </button>
      </div>
    </aside>
  );
};
