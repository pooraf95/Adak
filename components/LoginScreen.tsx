'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Store, Lock, User, ArrowLeft, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('لطفاً نام کاربری و کلمه عبور را وارد کنید.');
      return;
    }

    setLoading(true);
    const res = await login(username, password);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'اطلاعات ورود اشتباه است.');
    }
  };

  const handleQuickLogin = async (userKey: 'mehran' | 'Adak') => {
    setError('');
    setLoading(true);
    if (userKey === 'mehran') {
      setUsername('mehran');
      setPassword('MehranAdak');
      await login('mehran', 'MehranAdak');
    } else {
      setUsername('Adak');
      setPassword('123456');
      await login('Adak', '123456');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-white relative overflow-hidden" dir="rtl">
      {/* گرافیک پس‌زمینه لطیف */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* نشان و عنوان سامانه */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 mx-auto flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 mb-4">
            <Store className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            بوتیک آداک اورجینال
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            سیستم هوشمند انبارداری، حسابداری و صندوق فروش
          </p>
        </div>

        {/* پیام خطا در صورت وجود */}
        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* فرم ورود */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              نام کاربری
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mehran یا Adak"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-10 pl-3.5 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                dir="ltr"
                autoCapitalize="none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              کلمه عبور
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور خود را وارد کنید"
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pr-10 pl-3.5 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {loading ? 'در حال بررسی...' : 'ورود به سیستم'}
          </button>
        </form>

        {/* دکمه‌های ورود سریع تستی جهت سهولت */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 font-semibold mb-3">
            ورود سریع بر اساس نقش‌های تعیین شده:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('mehran')}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5"
            >
              <span>مهران (مدیر)</span>
              <span className="text-[10px] text-slate-400 font-normal">دسترسی کامل و سودها</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('Adak')}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5"
            >
              <span>آداک (شاگرد)</span>
              <span className="text-[10px] text-slate-400 font-normal">فقط ثبت فاکتور و تعویض</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

