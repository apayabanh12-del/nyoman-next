'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function GlobalReportRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    router.replace(user?.role === 'admin' ? '/admin/reports' : '/kasir/reports');
  }, [user, router]);

  return null;
}

export default function LaporanPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'petugas']}>
      <GlobalReportRedirect />
    </ProtectedRoute>
  );
}
