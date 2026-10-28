'use client';

import React from 'react';
import { AuthProvider, useAuth } from '@/lib/authContext';
import LoginScreen from './LoginScreen';
import Navbar from './Navbar';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">در حال بارگذاری بوتیک آداک...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 pb-24 md:pb-10">
        {children}
      </main>
    </>
  );
}

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppContent>{children}</AppContent>
    </AuthProvider>
  );
}

