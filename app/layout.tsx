import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'آداک اورجینال | حسابداری و انبارداری بوتیک مردانه',
  description: 'نرم‌افزار ساده و لمسی حسابداری، انبارداری و ثبت فاکتور نسیه برای بوتیک آداک اورجینال',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import AppWrapper from '@/components/AppWrapper';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-amber-500 selection:text-white">
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  );
}
