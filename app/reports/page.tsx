'use client';

import { useState, useEffect } from 'react';
import { getReportSummary, ReportSummary, getInvoices } from '@/lib/dataService';
import { Invoice } from '@/types/database';
import { formatToman, formatNumber, formatShamsiDate } from '@/lib/utils';
import { 
  BarChart3, 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CreditCard,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';

export default function ReportsPage() {
  const { isAdmin, user } = useAuth();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [summary, setSummary] = useState<ReportSummary>({
    invoiceCount: 0,
    grossSales: 0,
    netProfit: 0,
    totalDebt: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadReports();
    }
  }, [timeframe, isAdmin]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [sumData, allInvoices] = await Promise.all([
        getReportSummary(timeframe),
        getInvoices(),
      ]);
      setSummary(sumData);

      // فیلتر فاکتورهای متناسب با بازه
      const now = new Date();
      const filtered = allInvoices.filter((inv) => {
        const d = new Date(inv.created_at);
        if (timeframe === 'daily') {
          return (
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        } else if (timeframe === 'weekly') {
          return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
        } else {
          return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 30;
        }
      });
      setRecentInvoices(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getTimeframeTitle = () => {
    switch (timeframe) {
      case 'daily':
        return 'امروز (۲۴ ساعت گذشته)';
      case 'weekly':
        return 'هفته جاری (۷ روز اخیر)';
      case 'monthly':
        return 'ماه جاری (۳۰ روز اخیر)';
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">
          دسترسی محدود به مدیر بوتیک
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
          کاربر گرامی ({user?.name || 'پرسنل'})، بخش محاسبه سود، مارجین‌های مالی و گزارشات دخل تنها برای حساب کاربری مدیر بوتیک (مهران) در دسترس است.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ArrowRight className="w-4 h-4" />
            بازگشت به صندوق و ثبت فاکتور
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* هدر گزارش‌ها و دکمه‌های بازه زمانی */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            داشبورد سود و عملکرد فروش آداک
          </h2>
          <p className="text-xs text-slate-500">گزارش شفاف دخل، سود خالص و تعداد فاکتورها</p>
        </div>

        {/* سوییچ بازه‌های زمانی ۳ گانه لمسی */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setTimeframe('daily')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'daily'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            روزانه (امروز)
          </button>
          <button
            onClick={() => setTimeframe('weekly')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'weekly'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هفتگی
          </button>
          <button
            onClick={() => setTimeframe('monthly')}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ماهانه
          </button>
        </div>
      </div>

      {/* کارت‌های ۳ آمار کلیدی درخواستی */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* ۱. سود خالص (مهم‌ترین آمار مغازه) */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-5 rounded-3xl shadow-lg border border-emerald-500 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full text-emerald-100">
              سود خالص دخل
            </span>
            <div className="p-2 rounded-xl bg-white/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black mb-1">
            {formatToman(summary.netProfit)}
          </h3>
          <p className="text-[11px] text-emerald-100">
            تفاضل فروش از قیمت خرید کالاها ({getTimeframeTitle()})
          </p>
        </div>

        {/* ۲. مجموع درآمد ناخالص (فروش کلی) */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
              مجموع فروش ناخالص
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-1">
            {formatToman(summary.grossSales)}
          </h3>
          <p className="text-[11px] text-slate-400">
            کل مبالغ فاکتورها پس از کسر تخفیف
          </p>
        </div>

        {/* ۳. تعداد فاکتورهای ثبت شده */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              تعداد فاکتورها
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-1">
            {formatNumber(summary.invoiceCount)} عدد
          </h3>
          <p className="text-[11px] text-slate-400">
            فاکتورهای صادر شده در {getTimeframeTitle()}
          </p>
        </div>

      </div>

      {/* گزارش تکمیلی نسیه‌ها در این بازه */}
      {summary.totalDebt > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-800">
            <CreditCard className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-xs font-bold">نسیه‌های ایجاد شده در این بازه:</p>
              <p className="text-[11px] text-red-600">بدهی ثبت شده برای مشتریان در این فاکتورها</p>
            </div>
          </div>
          <span className="font-black text-base text-red-700">
            {formatToman(summary.totalDebt)}
          </span>
        </div>
      )}

      {/* ریز فاکتورهای ثبت شده در این بازه */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 space-y-3">
        <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
          <span>فاکتورهای ثبت شده در این بازه:</span>
          <span className="text-xs text-slate-400 font-normal">{formatNumber(recentInvoices.length)} فاکتور</span>
        </h4>

        {recentInvoices.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">در این بازه زمانی فاکتوری ثبت نشده است.</p>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-500">#{inv.invoice_number}</span>
                    <strong className="text-slate-800">{inv.customer_name}</strong>
                  </div>
                  <span className="text-[10px] text-slate-400">{formatShamsiDate(inv.created_at)}</span>
                </div>

                <div className="text-left space-y-0.5">
                  <span className="block font-black text-slate-900">{formatToman(inv.final_amount)}</span>
                  <span className="block text-[10px] text-emerald-600 font-bold">
                    سود: +{formatToman(inv.net_profit)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
