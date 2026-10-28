'use client';

import { useState, useEffect } from 'react';
import { Invoice, PaymentStatus } from '@/types/database';
import { getInvoices, deleteInvoice, updateInvoice } from '@/lib/dataService';
import { formatToman, formatNumber, formatShamsiDate, parsePersianNumber } from '@/lib/utils';
import { useAuth } from '@/lib/authContext';
import { 
  Receipt, 
  Search, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Eye, 
  Printer, 
  X,
  FileText,
  Edit2,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';

export default function InvoicesPage() {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'credit'>('all');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // وضعیت مودال ویرایش فاکتور
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('paid');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ۱. حذف / ابطال فاکتور با بازگشت موجودی به انبار و اصلاح بدهی
  const handleDeleteInvoice = async (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const confirmText = `آیا از ابطال و حذف فاکتور شماره #${inv.invoice_number} اطمینان دارید؟\n\nنکته مهم: با حذف فاکتور، تمام اقلام آن مجدداً به موجودی انبار برگردانده شده و بدهی مشتری نیز در صورت وجود اصلاح می‌گردد.`;
    
    if (!window.confirm(confirmText)) return;

    try {
      await deleteInvoice(inv.id);
      setInvoices((prev) => prev.filter((item) => item.id !== inv.id));
      if (selectedInvoice?.id === inv.id) {
        setSelectedInvoice(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در حذف فاکتور');
    }
  };

  // ۲. باز کردن مودال ویرایش فاکتور
  const handleOpenEdit = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingInvoice(inv);
    setEditCustomerName(inv.customer_name);
    setEditPaidAmount(inv.paid_amount.toString());
    setEditPaymentStatus(inv.payment_status);
    setEditNotes(inv.notes || '');
  };

  // ۳. ذخیره ویرایش فاکتور
  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setIsUpdating(true);
    try {
      const parsedPaid = parsePersianNumber(editPaidAmount);
      const updated = await updateInvoice(editingInvoice.id, {
        customer_name: editCustomerName.trim() || 'مشتری گذری',
        paid_amount: parsedPaid,
        payment_status: editPaymentStatus,
        notes: editNotes.trim() || undefined,
      });

      setInvoices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (selectedInvoice?.id === updated.id) {
        setSelectedInvoice(updated);
      }
      setEditingInvoice(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ویرایش فاکتور');
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'all' || inv.payment_status === statusFilter;
    const matchesSearch =
      !search.trim() ||
      inv.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoice_number.toString().includes(search);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: 'paid' | 'partial' | 'credit') => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            تسویه کامل
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            تسویه ناقص
          </span>
        );
      case 'credit':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-800">
            <CreditCard className="w-3.5 h-3.5" />
            نسیه کامل
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* هدر صفحه */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            تاریخچه و مدیریت فاکتورهای فروش
          </h2>
          <p className="text-xs text-slate-500">مشاهده فاکتورها، ویرایش، ابطال و چاپ</p>
        </div>

        {/* فیلتر وضعیت پرداخت */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه ({invoices.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تسویه کامل
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'partial'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            تسویه ناقص
          </button>
          <button
            onClick={() => setStatusFilter('credit')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'credit'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            نسیه
          </button>
        </div>
      </div>

      {/* جستجو */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام مشتری یا شماره فاکتور..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* لیست فاکتورها */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-600">هیچ فاکتوری در این وضعیت یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((inv) => (
            <div
              key={inv.id}
              onClick={() => setSelectedInvoice(inv)}
              className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    #{inv.invoice_number}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{inv.customer_name}</span>
                  {getStatusBadge(inv.payment_status)}
                </div>
                <p className="text-xs text-slate-400">
                  {formatShamsiDate(inv.created_at)}
                  {inv.notes ? ` • ${inv.notes}` : ''}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="text-right sm:text-left">
                  <span className="block font-black text-sm sm:text-base text-slate-900">
                    {formatToman(inv.final_amount)}
                  </span>
                  {inv.debt_amount > 0 && (
                    <span className="text-[11px] text-red-600 font-bold block">
                      بدهی: {formatToman(inv.debt_amount)}
                    </span>
                  )}
                </div>

                {/* دکمه‌های ویرایش، حذف و مشاهده */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(inv, e)}
                    title="ویرایش فاکتور"
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-slate-200/80"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteInvoice(inv, e)}
                    title="ابطال و حذف فاکتور"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200/80"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-amber-500 hover:text-white transition-colors">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال جزئیات و چاپ فاکتور */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* سربرگ فاکتور */}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="font-black text-slate-900 text-base">بوتیک آداک اورجینال</h3>
                  <p className="text-xs text-slate-500">فاکتور شماره #{selectedInvoice.invoice_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(selectedInvoice)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                  title="ویرایش فاکتور"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteInvoice(selectedInvoice)}
                  className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100"
                  title="ابطال و حذف فاکتور"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* مشخصات مشتری و تاریخ */}
            <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-1.5 mb-4 text-slate-700">
              <div className="flex justify-between">
                <span>نام مشتری:</span>
                <span className="font-bold text-slate-900">{selectedInvoice.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>تاریخ و ساعت:</span>
                <span>{formatShamsiDate(selectedInvoice.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>وضعیت پرداخت:</span>
                <span>{getStatusBadge(selectedInvoice.payment_status)}</span>
              </div>
              {selectedInvoice.notes && (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span>یادداشت:</span>
                  <span className="text-slate-600">{selectedInvoice.notes}</span>
                </div>
              )}
            </div>

            {/* اقلام فاکتور */}
            <div className="space-y-2 mb-4">
              <h4 className="font-bold text-xs text-slate-500">شرح اقلام:</h4>
              <div className="divide-y divide-slate-100 border rounded-2xl overflow-hidden">
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  selectedInvoice.items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between text-xs bg-white">
                      <div>
                        <p className="font-bold text-slate-800">{it.product_name}</p>
                        <p className="text-[11px] text-slate-400">
                          {formatNumber(it.quantity)} عدد × {formatToman(it.unit_price)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900">{formatToman(it.total_price)}</span>
                    </div>
                  ))
                ) : (
                  <p className="p-3 text-xs text-slate-400 text-center">اقلام در سیستم ثبت شده است.</p>
                )}
              </div>
            </div>

            {/* محاسبات مالی */}
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-2 text-xs mb-4">
              <div className="flex justify-between text-slate-300">
                <span>جمع کل:</span>
                <span>{formatToman(selectedInvoice.total_amount)}</span>
              </div>
              {selectedInvoice.discount_amount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>تخفیف اعمال شده:</span>
                  <span>- {formatToman(selectedInvoice.discount_amount)}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
                <span>مبلغ نهایی:</span>
                <span className="text-amber-400">{formatToman(selectedInvoice.final_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>مبلغ دریافتی نقد/پوز:</span>
                <span>{formatToman(selectedInvoice.paid_amount)}</span>
              </div>
              {selectedInvoice.debt_amount > 0 && (
                <div className="flex justify-between text-red-400 font-bold bg-red-950/40 p-2 rounded-lg border border-red-800/40">
                  <span>مانده به عنوان بدهی (نسیه):</span>
                  <span>{formatToman(selectedInvoice.debt_amount)}</span>
                </div>
              )}
            </div>

            {/* دکمه چاپ فاکتور و بستن */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4" />
                چاپ فاکتور
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="py-3 px-5 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال ویرایش فاکتور */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                ویرایش فاکتور #{editingInvoice.invoice_number}
              </h3>
              <button
                onClick={() => setEditingInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام مشتری
                </label>
                <input
                  type="text"
                  required
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مبلغ پرداخت شده (تومان)
                </label>
                <input
                  type="text"
                  value={editPaidAmount}
                  onChange={(e) => setEditPaidAmount(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  مبلغ نهایی فاکتور: {formatToman(editingInvoice.final_amount)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  وضعیت تسویه فاکتور
                </label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                >
                  <option value="paid">تسویه کامل (پرداخت شده)</option>
                  <option value="partial">تسویه ناقص (بخشی نسیه)</option>
                  <option value="credit">نسیه کامل</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  یادداشت فاکتور
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="توضیحات یا یادداشت‌های فاکتور..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
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
                  {isUpdating ? 'در حال ذخیره...' : 'ذخیره فاکتور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
