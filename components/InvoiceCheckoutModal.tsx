'use client';

import { useState } from 'react';
import { Customer, CartItem } from '@/types/database';
import { formatToman, formatNumber, parsePersianNumber } from '@/lib/utils';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  ShoppingBag
} from 'lucide-react';
import QuickCustomerModal from './QuickCustomerModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  customers: Customer[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onCustomerAdded: (newCustomer: Customer) => void;
  onSubmitInvoice: (invoiceData: {
    customerId: string | null;
    customerName: string;
    discountAmount: number;
    paidAmount: number;
    notes?: string;
  }) => Promise<void>;
}

const DISCOUNT_PRESETS = [0, 20000, 50000, 100000, 200000];

export default function InvoiceCheckoutModal({
  isOpen,
  onClose,
  cartItems,
  customers,
  onUpdateQuantity,
  onRemoveItem,
  onCustomerAdded,
  onSubmitInvoice,
}: Props) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [customDiscount, setCustomDiscount] = useState<string>('');
  
  // وضعیت پرداخت: 'paid' (تسویه کامل), 'partial' (تسویه ناقص), 'credit' (نسیه کامل)
  const [paymentMode, setPaymentMode] = useState<'paid' | 'partial' | 'credit'>('paid');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // محاسبه مبالغ
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  
  const activeDiscount = customDiscount ? parsePersianNumber(customDiscount) : discountAmount;
  const finalAmount = Math.max(0, totalAmount - activeDiscount);

  // محاسبه مبلغ پرداختی و مانده بدهی بر اساس حالت پرداخت
  let actualPaid = finalAmount;
  if (paymentMode === 'credit') {
    actualPaid = 0;
  } else if (paymentMode === 'partial') {
    const parsedPaid = parsePersianNumber(paidAmountInput);
    actualPaid = Math.min(finalAmount, Math.max(0, parsedPaid));
  }
  const debtAmount = Math.max(0, finalAmount - actualPaid);

  // اطلاعات مشتری انتخاب شده
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    setErrorMsg('');
  };

  const handleApplyPresetDiscount = (val: number) => {
    setDiscountAmount(val);
    setCustomDiscount('');
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    if (cartItems.length === 0) {
      setErrorMsg('سبد خرید خالی است!');
      return;
    }

    // اگر نسیه یا پرداخت ناقص باشد، حتما باید مشتری مشخص باشد
    if (debtAmount > 0 && !selectedCustomerId) {
      setErrorMsg('برای ثبت نسیه یا تسویه ناقص، حتما باید یک مشتری از لیست انتخاب کنید یا مشتری جدید ثبت نمایید!');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitInvoice({
        customerId: selectedCustomerId || null,
        customerName: selectedCustomer ? selectedCustomer.name : 'مشتری گذری',
        discountAmount: activeDiscount,
        paidAmount: actualPaid,
        notes,
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'خطا در ثبت فاکتور');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
          
          {/* هدر مودال */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-900">تکمیل و صدور فاکتور فروش</h2>
                <p className="text-xs text-slate-500">{cartItems.length} ردیف کالا در سبد</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* محتوای اسکرول‌خور مودال */}
          <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
            
            {errorMsg && (
              <div className="p-3.5 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* بخش ۱: اقلام فاکتور */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                <span>اقلام انتخاب شده:</span>
                <span className="text-xs text-slate-500 font-normal">کل مبلغ قبل تخفیف: {formatToman(totalAmount)}</span>
              </h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80"
                  >
                    <div className="flex-1 min-w-0 ml-2">
                      <p className="text-sm font-bold text-slate-800 truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatToman(item.unit_price)} × {formatNumber(item.quantity)} ={' '}
                        <span className="font-bold text-slate-700">
                          {formatToman(item.quantity * item.unit_price)}
                        </span>
                      </p>
                    </div>

                    {/* دکمه‌های کم و زیاد کردن لمسی */}
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-amber-500 hover:text-white flex items-center justify-center font-bold text-slate-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="w-7 text-center font-bold text-sm text-slate-800">
                        {formatNumber(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-500 hover:text-white flex items-center justify-center font-bold text-slate-700 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="mr-2 p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* بخش ۲: انتخاب مشتری (بدون نیاز به تایپ با لیست کشویی + دکمه مشتری جدید) */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <span>نام مشتری:</span>
                  {selectedCustomer && selectedCustomer.total_debt > 0 && (
                    <span className="text-[11px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full border border-red-200">
                      بدهی قبلی: {formatToman(selectedCustomer.total_debt)}
                    </span>
                  )}
                </label>

                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + مشتری جدید
                </button>
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full text-sm font-semibold p-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
              >
                <option value="">👤 مشتری گذری (نقدی و بدون ثبت پرونده)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} {c.total_debt > 0 ? `[بدهکار: ${formatNumber(c.total_debt)} ت]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* بخش ۳: تخفیف با دکمه‌های آماده لمسی */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                تخفیف روی فاکتور:
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {DISCOUNT_PRESETS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleApplyPresetDiscount(val)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      discountAmount === val && !customDiscount
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {val === 0 ? 'بدون تخفیف' : formatNumber(val) + ' ت'}
                  </button>
                ))}
              </div>
              
              {/* ورودی مبلغ دلخواه تخفیف */}
              <input
                type="text"
                value={customDiscount}
                onChange={(e) => {
                  setCustomDiscount(e.target.value);
                  setDiscountAmount(0);
                }}
                placeholder="یا مبلغ دلخواه تخفیف (به تومان)..."
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* بخش ۴: وضعیت تسویه و نسیه (۳ دکمه بزرگ واضح) */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-800">
                نحوه تسویه فاکتور:
              </label>
              
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMode('paid')}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all ${
                    paymentMode === 'paid'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-md font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs md:text-sm">تسویه کامل</span>
                  <span className="text-[10px] text-emerald-700">کارتخوان / نقد</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('partial');
                    if (!paidAmountInput) setPaidAmountInput(Math.round(finalAmount / 2).toString());
                  }}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all ${
                    paymentMode === 'partial'
                      ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-md font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-xs md:text-sm">تسویه ناقص</span>
                  <span className="text-[10px] text-amber-700">بخشی نقد، مابقی نسیه</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('credit')}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all ${
                    paymentMode === 'credit'
                      ? 'border-red-500 bg-red-50/80 text-red-900 shadow-md font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <span className="text-xs md:text-sm">نسیه کامل</span>
                  <span className="text-[10px] text-red-700">کل فاکتور به حساب بدهی</span>
                </button>
              </div>

              {/* اگر تسویه ناقص باشد: تعیین مبلغ پرداختی فعلی */}
              {paymentMode === 'partial' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-amber-900">
                    مبلغ پرداخت شده در لحظه (به تومان):
                  </label>
                  <input
                    type="text"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    placeholder="مثال: 500000"
                    className="w-full text-base font-bold px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                  <div className="flex justify-between text-xs text-amber-800 font-semibold pt-1">
                    <span>مانده بدهی این فاکتور:</span>
                    <span className="text-red-600 font-black text-sm">{formatToman(debtAmount)}</span>
                  </div>
                </div>
              )}

              {/* یادداشت اختیاری */}
              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="یادداشت فاکتور (اختیاری: مثلا سایز شلوار تعویض می‌شود)..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* بخش ۵: خلاصه محاسبات نهایی */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 shadow-lg">
              <div className="flex justify-between text-xs text-slate-400">
                <span>جمع اقلام:</span>
                <span>{formatToman(totalAmount)}</span>
              </div>
              {activeDiscount > 0 && (
                <div className="flex justify-between text-xs text-amber-400">
                  <span>تخفیف:</span>
                  <span>- {formatToman(activeDiscount)}</span>
                </div>
              )}
              <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                <span>مبلغ نهایی فاکتور:</span>
                <span className="text-amber-400 text-base">{formatToman(finalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 text-emerald-400">
                <span>دریافتی نقد / پوز:</span>
                <span className="font-bold">{formatToman(actualPaid)}</span>
              </div>
              {debtAmount > 0 && (
                <div className="flex justify-between text-xs text-red-400 font-bold bg-red-950/40 p-2 rounded-lg border border-red-800/50">
                  <span>ثبت بدهی به حساب {selectedCustomer?.name || 'مشتری'}:</span>
                  <span>{formatToman(debtAmount)}</span>
                </div>
              )}
            </div>

          </div>

          {/* فوتر مودال با دکمه بزرگ ثبت */}
          <div className="p-4 border-t border-slate-100 bg-white">
            <button
              type="button"
              disabled={isSubmitting || cartItems.length === 0}
              onClick={handleSubmit}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {isSubmitting ? 'در حال ثبت فاکتور...' : `ثبت و صدور نهایی فاکتور (${formatToman(finalAmount)})`}
            </button>
          </div>

        </div>
      </div>

      {/* مودال ثبت سریع مشتری جدید */}
      <QuickCustomerModal
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCustomerAdded={(newCust) => {
          onCustomerAdded(newCust);
          setSelectedCustomerId(newCust.id);
        }}
      />
    </>
  );
}
