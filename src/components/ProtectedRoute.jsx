'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const Spinner = ({ label }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
    </div>
  </div>
);

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const roleAllowed = !allowedRoles || (user && allowedRoles.includes(user.role));

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
    } else if (!roleAllowed) {
      // Arahkan ke halaman default masing-masing role jika melanggar hak akses
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/kasir');
    }
  }, [loading, user, roleAllowed, router]);

  if (loading) return <Spinner label="Memuat sesi..." />;
  if (!user || !roleAllowed) return <Spinner />;

  return children;
};

export default ProtectedRoute;
