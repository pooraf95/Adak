'use client';

import { useState, useEffect } from 'react';
import { Customer } from '@/types/database';
import { getCustomers, payCustomerDebt, updateCustomer, deleteCustomer } from '@/lib/dataService';
import { formatToman, formatNumber, parsePersianNumber, formatShamsiDate } from '@/lib/utils';
import { 
  Users, 
  UserPlus, 
  Search, 
  CreditCard, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Banknote,
  History,
  Edit2,
  Trash2,
  Save
} from 'lucide-react';
import QuickCustomerModal from '@/components/QuickCustomerModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'debtors' | 'settled'>('debtors');
  const [showAddModal, setShowAddModal] = useState(false);

  // مودال تسویه بدهی
  const [activePaymentCustomer, setActivePaymentCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('کارتخوان');
  const [payNotes, setPayNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // مودال ویرایش مشتری
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (customer: Customer) => {
    setActivePaymentCustomer(customer);
    setPayAmount(customer.total_debt.toString());
    setPayMethod('کارتخوان');
    setPayNotes('');
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentCustomer) return;
    const amount = parsePersianNumber(payAmount);
    if (amount <= 0) return;

    setIsPaying(true);
    try {
      await payCustomerDebt(activePaymentCustomer.id, amount, payMethod, payNotes);
      await loadCustomers();
      setActivePaymentCustomer(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ثبت پرداخت');
    } finally {
      setIsPaying(false);
    }
  };

  // ۱. باز کردن مودال ویرایش مشتری
  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone || '');
    setEditNotes(c.notes || '');
  };

  // ۲. ذخیره ویرایش مشتری
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editName.trim()) return;

    setIsUpdating(true);
    try {
      const updated = await updateCustomer(editingCustomer.id, {
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
        notes: editNotes.trim() || undefined,
      });

      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCustomer(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ویرایش مشتری');
    } finally {
      setIsUpdating(false);
    }
  };

  // ۳. حذف مشتری
  const handleDeleteCustomer = async (c: Customer) => {
    let confirmMsg = `آیا از حذف مشتری «${c.name}» اطمینان دارید؟`;
    if (c.total_debt > 0) {
      confirmMsg += `\n\nهشدار: این مشتری مبلغ ${formatToman(c.total_debt)} بدهی وصول‌نشده دارد!`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteCustomer(c.id);
      setCustomers((prev) => prev.filter((item) => item.id !== c.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در حذف مشتری');
    }
  };

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + (c.total_debt || 0), 0);
  const totalDebtorsCount = customers.filter((c) => c.total_debt > 0).length;

  const filtered = customers.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search));

    if (filterMode === 'debtors') return matchesSearch && c.total_debt > 0;
    if (filterMode === 'settled') return matchesSearch && c.total_debt === 0;
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* کارت خلاصه کل طلب‌های نسیه بوتیک */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-700">
        <div>
          <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-1">
            دفتر نسیه و حساب دفتری آداک
          </span>
          <h2 className="text-xl sm:text-2xl font-black">
            {formatToman(totalOutstandingDebt)}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            مجموع مطالبات وصول‌نشده از {formatNumber(totalDebtorsCount)} مشتری بدهکار
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <UserPlus className="w-4 h-4" />
          + ثبت مشتری جدید
        </button>
      </div>

      {/* فیلترها و جستجو */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام یا تلفن مشتری..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterMode('debtors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === 'debtors'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            فقط بدهکاران ({totalDebtorsCount})
          </button>

          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه مشتریان ({customers.length})
          </button>

          <button
            onClick={() => setFilterMode('settled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterMode === 'settled'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تسویه‌شده
          </button>
        </div>
      </div>

      {/* لیست مشتریان */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <p className="font-bold text-slate-600">مشتری مورد نظر یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-300 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-slate-900">{c.name}</h3>
                  {c.total_debt > 0 ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      بدهکار
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      بی‌حساب
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {c.phone && (
                    <span className="flex items-center gap-1" dir="ltr">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {c.phone}
                    </span>
                  )}
                  {c.notes && <span className="text-slate-400">«{c.notes}»</span>}
                </div>
              </div>

              {/* مانده بدهی و دکمه‌های عملیاتی */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-right sm:text-left">
                  <span className="text-[10px] text-slate-400 block">مانده بدهی:</span>
                  <span
                    className={`font-black text-sm sm:text-base ${
                      c.total_debt > 0 ? 'text-red-600' : 'text-slate-500'
                    }`}
                  >
                    {formatToman(c.total_debt)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* دکمه تسویه نسیه */}
                  {c.total_debt > 0 && (
                    <button
                      onClick={() => handleOpenPayment(c)}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      تسویه
                    </button>
                  )}

                  {/* دکمه‌های ویرایش و حذف */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(c)}
                    title="ویرایش مشتری"
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-slate-200/80"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(c)}
                    title="حذف مشتری"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال ثبت تسویه / دریافت وجه بدهی مشتری */}
      {activePaymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                ثبت دریافت بدهی: {activePaymentCustomer.name}
              </h3>
              <button
                onClick={() => setActivePaymentCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="p-3 bg-red-50 text-red-800 rounded-2xl text-xs flex justify-between font-bold border border-red-200">
                <span>کل بدهی فعلی مشتری:</span>
                <span>{formatToman(activePaymentCustomer.total_debt)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مبلغ دریافتی (تومان) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full text-base font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  روش پرداخت:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['کارتخوان', 'کارت به کارت', 'نقدی'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayMethod(m)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        payMethod === m
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="توضیحات یا شماره پیگیری تراکنش..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePaymentCustomer(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isPaying ? 'در حال ثبت...' : 'ثبت و کسر بدهی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ویرایش اطلاعات مشتری */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                ویرایش مشخصات مشتری
              </h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام و نام خانوادگی <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شماره موبایل
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  یادداشت یا توضیحات
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="مثال: سایز L، مشتری معرف فلانی..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isUpdating ? 'در حال ذخیره...' : 'ذخیره مشخصات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ثبت مشتری جدید */}
      <QuickCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCustomerAdded={(newCust) => {
          setCustomers([newCust, ...customers]);
        }}
      />
    </div>
  );
}
