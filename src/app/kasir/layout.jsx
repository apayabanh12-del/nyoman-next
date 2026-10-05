'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PetugasLayout } from '@/layouts/PetugasLayout';

export default function KasirRootLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={['petugas']}>
      <PetugasLayout>{children}</PetugasLayout>
    </ProtectedRoute>
  );
}
