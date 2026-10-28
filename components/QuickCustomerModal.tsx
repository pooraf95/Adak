'use client';

import { useState } from 'react';
import { Customer } from '@/types/database';
import { addCustomer } from '@/lib/dataService';
import { UserPlus, X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: (newCustomer: Customer) => void;
}

export default function QuickCustomerModal({ isOpen, onClose, onCustomerAdded }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('لطفا نام مشتری را وارد کنید');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const created = await addCustomer({ name, phone });
      onCustomerAdded(created);
      setName('');
      setPhone('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت مشتری');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b pb-4 mb-5">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg">ثبت سریع مشتری جدید</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              نام و نام خانوادگی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: پوریا کریمی"
              className="w-full text-base px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              شماره موبایل (اختیاری برای نسیه)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 09121234567"
              dir="ltr"
              className="w-full text-base px-4 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50 text-right"
            />
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {loading ? 'در حال ثبت...' : 'تایید و انتخاب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
