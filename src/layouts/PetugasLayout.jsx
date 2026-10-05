'use client';

import React from 'react';
import { Navbar } from '@/components/Navbar';

export const PetugasLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
