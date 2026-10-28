'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { 
  Receipt, 
  Package, 
  Users, 
  BarChart3, 
  History, 
  Store,
  LogOut,
  Shield,
  UserCheck
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { href: '/', label: 'ثبت فاکتور', icon: Receipt, adminOnly: false },
  { href: '/invoices', label: 'فاکتورها', icon: History, adminOnly: false },
  { href: '/products', label: 'انبار کالا', icon: Package, adminOnly: false },
  { href: '/customers', label: 'مشتریان و نسیه', icon: Users, adminOnly: false },
  { href: '/reports', label: 'گزارش سود', icon: BarChart3, adminOnly: true },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  // فیلتر کردن آیتم‌های منو بر اساس سطح دسترسی (مخفی‌سازی گزارش سود برای کاربر غیرمدیر)
  const navItems = ALL_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    if (window.confirm('آیا قصد خروج از حساب کاربری را دارید؟')) {
      logout();
    }
  };

  return (
    <>
      {/* هدر بالای صفحه در موبایل و دسکتاپ */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          {/* لوگو و نام بوتیک */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/10 flex-shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                آداک اورجینال
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 hidden xs:inline-block">
                  بوتیک مردانه
                </span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400">انبارداری و صندوق فروش</p>
            </div>
          </div>

          {/* منوی افقی در دسکتاپ */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* اطلاعات کاربر وارد شده و دکمه خروج */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 border border-slate-700/80 px-2.5 sm:px-3 py-1.5 rounded-2xl">
                <div className={`p-1 rounded-lg ${isAdmin ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {isAdmin ? <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-200">{user.username}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                      isAdmin ? 'bg-amber-500 text-slate-950' : 'bg-blue-500 text-white'
                    }`}>
                      {isAdmin ? 'مدیر' : 'پرسنل'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 hidden sm:block">
                    {isAdmin ? 'دسترسی مالی و سود' : 'فروش و انبار'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="خروج از حساب"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-xl transition-all mr-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* منوی پایین صفحه مخصوص موبایل (Bottom Bar) با دکمه‌های بزرگ و دسترسی سریع */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe shadow-2xl">
        <div className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} h-16`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-amber-500/20 text-amber-400 scale-110' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
