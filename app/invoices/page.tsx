'use client';

import { useState, useEffect, useMemo } from 'react';
import { Invoice, PaymentStatus, Product, ExchangeItemInput } from '@/types/database';
import { 
  getInvoices, 
  getProducts, 
  deleteInvoice, 
  updateInvoice, 
  processInvoiceExchangeOrReturn 
} from '@/lib/dataService';
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
  AlertTriangle,
  ArrowLeftRight,
  Plus,
  Minus,
  RotateCcw,
  ShoppingBag,
  Info,
  Check
} from 'lucide-react';

export default function InvoicesPage() {
  const { user, isAdmin } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'credit'>('all');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // وضعیت مودال ویرایش و تعویض/مرجوعی فاکتور
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'exchange' | 'general'>('exchange');
  
  // اقلام مرجوعی (نگاشت شناسه محصول به تعداد مرجوعی)
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  
  // اقلام تعویضی جدید
  const [exchangeItems, setExchangeItems] = useState<ExchangeItemInput[]>([]);
  const [selectedExchangeProdId, setSelectedExchangeProdId] = useState('');
  const [exchangeProductSearch, setExchangeProductSearch] = useState('');
  const [exchangeItemQty, setExchangeItemQty] = useState(1);
  const [exchangeReason, setExchangeReason] = useState('');
  const [diffPaymentMode, setDiffPaymentMode] = useState<'cash_received' | 'debt_added' | 'refund_paid' | 'debt_deducted' | 'even'>('cash_received');

  // فیلدهای عمومی فاکتور
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('paid');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, prodData] = await Promise.all([getInvoices(), getProducts()]);
      setInvoices(invData);
      setProducts(prodData);
    } catch (e) {
      console.error('Error loading invoices data:', e);
    } finally {
      setLoading(false);
    }
  };

  // ۱. حذف / ابطال فاکتور (فقط مخصوص مدیر)
  const handleDeleteInvoice = async (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAdmin) {
      alert('شما به عنوان شاگرد دسترسی حذف یا ابطال فاکتور را ندارید.');
      return;
    }

    const confirmText = `آیا از ابطال و حذف فاکتور شماره #${inv.invoice_number} اطمینان دارید؟\n\nنکته مهم: با حذف فاکتور، تمام اقلام آن مجدداً به موجودی انبار برگردانده شده و بدهی مشتری نیز در صورت وجود اصلاح می‌گردد.`;
    
    if (!window.confirm(confirmText)) return;

    try {
      await deleteInvoice(inv.id);
      setInvoices((prev) => prev.filter((item) => item.id !== inv.id));
      if (selectedInvoice?.id === inv.id) {
        setSelectedInvoice(null);
      }
      showNotice(`فاکتور شماره #${inv.invoice_number} با موفقیت حذف و ابطال شد.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در حذف فاکتور');
    }
  };

  // ۲. باز کردن مودال ویرایش و تعویض فاکتور (برای هر دو کاربر فعال)
  const handleOpenEdit = (inv: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingInvoice(inv);
    setActiveEditTab('exchange');
    setReturnQuantities({});
    setExchangeItems([]);
    setSelectedExchangeProdId(products.length > 0 ? products[0].id : '');
    setExchangeProductSearch('');
    setExchangeItemQty(1);
    setExchangeReason('');
    setDiffPaymentMode('cash_received');

    setEditCustomerName(inv.customer_name);
    setEditPaidAmount(inv.paid_amount.toString());
    setEditPaymentStatus(inv.payment_status);
    setEditNotes(inv.notes || '');
  };

  // ۳. کنترل تعداد مرجوعی برای اقلام موجود فاکتور
  const handleReturnQtyChange = (itemKey: string, maxQty: number, delta: number) => {
    setReturnQuantities((prev) => {
      const current = prev[itemKey] || 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      return { ...prev, [itemKey]: next };
    });
  };

  const handleReturnAll = (itemKey: string, maxQty: number) => {
    setReturnQuantities((prev) => ({ ...prev, [itemKey]: maxQty }));
  };

  const handleResetReturn = (itemKey: string) => {
    setReturnQuantities((prev) => ({ ...prev, [itemKey]: 0 }));
  };

  // ۴. افزودن کالای جدید تعویضی
  const handleAddExchangeItem = () => {
    if (!selectedExchangeProdId) return;
    const prod = products.find((p) => p.id === selectedExchangeProdId);
    if (!prod) return;

    setExchangeItems((prev) => {
      const existing = prev.find((x) => x.productId === prod.id);
      if (existing) {
        return prev.map((x) =>
          x.productId === prod.id ? { ...x, quantity: x.quantity + exchangeItemQty } : x
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: exchangeItemQty,
          unitPrice: prod.selling_price,
          unitPurchasePrice: prod.purchase_price,
        },
      ];
    });

    setExchangeItemQty(1);
  };

  const handleRemoveExchangeItem = (productId: string) => {
    setExchangeItems((prev) => prev.filter((x) => x.productId !== productId));
  };

  // محاسبات آنلاین تعویض و مرجوعی
  const totalReturnValue = useMemo(() => {
    if (!editingInvoice || !editingInvoice.items) return 0;
    return editingInvoice.items.reduce((sum, it) => {
      const key = it.product_id || it.product_name;
      const retQty = returnQuantities[key] || 0;
      return sum + retQty * it.unit_price;
    }, 0);
  }, [editingInvoice, returnQuantities]);

  const totalExchangeValue = useMemo(() => {
    return exchangeItems.reduce((sum, x) => sum + x.quantity * x.unitPrice, 0);
  }, [exchangeItems]);

  // مابه‌التفاوت نهایی: اگر مثبت باشد مشتری باید بپردازد، اگر منفی باشد بوتیک باید عودت دهد
  const netDifference = totalExchangeValue - totalReturnValue;

  // ۵. ذخیره نهایی تعویض / مرجوعی یا ویرایش فاکتور
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setIsUpdating(true);
    try {
      const hasExchangeOrReturn = totalReturnValue > 0 || totalExchangeValue > 0;

      if (hasExchangeOrReturn) {
        // اجرای عملیات تعویض و مرجوعی
        const returnedList = (editingInvoice.items || [])
          .filter((it) => (returnQuantities[it.product_id || it.product_name] || 0) > 0)
          .map((it) => ({
            productId: it.product_id || '',
            productName: it.product_name,
            quantityToReturn: returnQuantities[it.product_id || it.product_name] || 0,
            unitPrice: it.unit_price,
            unitPurchasePrice: it.unit_purchase_price,
          }));

        let finalDiffMode = diffPaymentMode;
        if (netDifference > 0 && finalDiffMode !== 'debt_added') finalDiffMode = 'cash_received';
        if (netDifference < 0 && finalDiffMode !== 'debt_deducted') finalDiffMode = 'refund_paid';
        if (netDifference === 0) finalDiffMode = 'even';

        const updated = await processInvoiceExchangeOrReturn({
          invoiceId: editingInvoice.id,
          returnedItems: returnedList,
          newExchangeItems: exchangeItems,
          differenceMode: finalDiffMode,
          differenceAmount: Math.abs(netDifference),
          operatorName: user?.name || user?.username || 'پرسنل بوتیک',
          customerName: isAdmin ? editCustomerName.trim() : editingInvoice.customer_name,
          customNotes: exchangeReason.trim() || undefined,
        });

        setInvoices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        if (selectedInvoice?.id === updated.id) setSelectedInvoice(updated);
        setEditingInvoice(null);
        showNotice(`تعویض و مرجوعی فاکتور #${updated.invoice_number} با موفقیت در سیستم و انبار ثبت گردید.`);
      } else {
        // ویرایش عمومی فاکتور (توسط مدیر)
        if (!isAdmin) {
          alert('هیچ تغییری در تعویض یا مرجوعی کالا مشخص نشده است.');
          setIsUpdating(false);
          return;
        }

        const parsedPaid = parsePersianNumber(editPaidAmount);
        const updated = await updateInvoice(editingInvoice.id, {
          customer_name: editCustomerName.trim() || 'مشتری گذری',
          paid_amount: parsedPaid,
          payment_status: editPaymentStatus,
          notes: editNotes.trim() || undefined,
        });

        setInvoices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        if (selectedInvoice?.id === updated.id) setSelectedInvoice(updated);
        setEditingInvoice(null);
        showNotice(`اطلاعات فاکتور #${updated.invoice_number} ویرایش شد.`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ثبت تغییرات فاکتور');
    } finally {
      setIsUpdating(false);
    }
  };

  const showNotice = (msg: string) => {
    setActionSuccessNotice(msg);
    setTimeout(() => setActionSuccessNotice(null), 5000);
  };

  // فیلتر جستجوی محصولات برای تعویض
  const filteredAvailableProducts = products.filter((p) =>
    !exchangeProductSearch.trim() || p.name.toLowerCase().includes(exchangeProductSearch.toLowerCase())
  );

  const filteredInvoices = invoices.filter((inv) => {
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
      {/* اعلان موفقیت */}
      {actionSuccessNotice && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold text-sm">{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className="text-xs bg-emerald-800/80 hover:bg-emerald-900 px-3 py-1 rounded-xl font-semibold"
          >
            بستن
          </button>
        </div>
      )}

      {/* هدر صفحه */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            تاریخچه، تعویض و مدیریت فاکتورها
          </h2>
          <p className="text-xs text-slate-500">
            {isAdmin
              ? 'مشاهده فاکتورها، تعویض و مرجوعی، ویرایش و ابطال'
              : 'مشاهده فاکتورها، ثبت تعویض و مرجوعی اجناس (حذف فاکتور فقط توسط مدیر)'}
          </p>
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
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-600">هیچ فاکتوری در این وضعیت یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredInvoices.map((inv) => (
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

                {/* دکمه‌های تعویض/ویرایش، حذف و مشاهده */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEdit(inv, e)}
                    title="ویرایش، تعویض یا مرجوعی کالا"
                    className="py-1.5 px-2.5 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-300 text-xs font-bold flex items-center gap-1"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                    <span>تعویض و مرجوعی</span>
                  </button>

                  {/* دکمه حذف فقط برای مدیر نمایش داده می‌شود */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteInvoice(inv, e)}
                      title="ابطال و حذف فاکتور"
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

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
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(selectedInvoice)}
                  className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-300 flex items-center gap-1"
                  title="ویرایش، تعویض و مرجوعی"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
                  <span>تعویض / مرجوعی</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteInvoice(selectedInvoice)}
                    className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100"
                    title="ابطال و حذف فاکتور"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
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
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="font-bold block mb-1">یادداشت و سوابق:</span>
                  <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed bg-white p-2 rounded-xl border border-slate-200">
                    {selectedInvoice.notes}
                  </p>
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

      {/* مودال جامع تعویض، مرجوعی و ویرایش فاکتور (باز برای هر دو کاربر) */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            {/* سربرگ مودال */}
            <div className="flex items-center justify-between border-b pb-3 mb-3">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-amber-500" />
                  تعویض، مرجوعی و ویرایش فاکتور #{editingInvoice.invoice_number}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  خریدار: <strong className="text-slate-700">{editingInvoice.customer_name}</strong> | تاریخ صدور:{' '}
                  {formatShamsiDate(editingInvoice.created_at)}
                </p>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* زبانه‌های بالا (تعویض و مرجوعی / تنظیمات عمومی فقط مدیر) */}
            <div className="flex items-center gap-2 border-b pb-2.5 mb-3 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveEditTab('exchange')}
                className={`py-1.5 px-3.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeEditTab === 'exchange'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                تعویض و مرجوعی اجناس
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveEditTab('general')}
                  className={`py-1.5 px-3.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    activeEditTab === 'general'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  ویرایش مشخصات مالی (مدیر)
                </button>
              )}
            </div>

            {/* بدنه اسکرول‌خور مودال */}
            <form onSubmit={handleSaveInvoice} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {activeEditTab === 'exchange' ? (
                <>
                  {/* بخش ۱: اقلام خریداری‌شده جهت مرجوعی */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <RotateCcw className="w-4 h-4 text-rose-500" />
                        ۱. انتخاب اقلام پس‌آورده شده (مرجوعی از این فاکتور):
                      </h4>
                      {totalReturnValue > 0 && (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                          ارزش کل مرجوعی: - {formatToman(totalReturnValue)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {editingInvoice.items && editingInvoice.items.length > 0 ? (
                        editingInvoice.items.map((it, idx) => {
                          const itemKey = it.product_id || it.product_name;
                          const retQty = returnQuantities[itemKey] || 0;
                          const remainingQty = it.quantity - retQty;

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border transition-all ${
                                retQty > 0
                                  ? 'bg-rose-50/60 border-rose-300 shadow-sm'
                                  : 'bg-white border-slate-200/80'
                              } flex flex-col sm:flex-row sm:items-center justify-between gap-2.5`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900">{it.product_name}</span>
                                  {retQty > 0 && (
                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                                      {retQty === it.quantity ? 'مرجوعی کامل' : `${retQty} عدد مرجوعی`}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-3">
                                  <span>
                                    خریداری شده: <strong>{formatNumber(it.quantity)} عدد</strong> × {formatToman(it.unit_price)}
                                  </span>
                                  <span>باقیمانده: <strong>{formatNumber(remainingQty)} عدد</strong></span>
                                </div>
                              </div>

                              {/* کنترل تعداد مرجوعی با دکمه‌های لمسی */}
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                  <button
                                    type="button"
                                    onClick={() => handleReturnQtyChange(itemKey, it.quantity, 1)}
                                    disabled={retQty >= it.quantity}
                                    className="p-1 rounded-lg hover:bg-rose-500 hover:text-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-700 transition-colors"
                                    title="افزایش تعداد مرجوعی"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>

                                  <div className="px-2 text-center min-w-10">
                                    <span className="block font-black text-xs text-slate-900">
                                      {formatNumber(retQty)}
                                    </span>
                                    <span className="text-[9px] text-slate-400 block -mt-0.5">مرجوع</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleReturnQtyChange(itemKey, it.quantity, -1)}
                                    disabled={retQty <= 0}
                                    className="p-1 rounded-lg hover:bg-slate-200 text-slate-700 disabled:opacity-30 transition-colors"
                                    title="کاهش تعداد مرجوعی"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    retQty === it.quantity
                                      ? handleResetReturn(itemKey)
                                      : handleReturnAll(itemKey, it.quantity)
                                  }
                                  className="text-[10px] font-bold px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 whitespace-nowrap"
                                >
                                  {retQty === it.quantity ? 'لغو مرجوعی' : 'مرجوعی کل'}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-2">اقلامی برای این فاکتور یافت نشد.</p>
                      )}
                    </div>
                  </div>

                  {/* بخش ۲: کالای جدید جایگزین (تعویض) */}
                  <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-amber-500" />
                        ۲. کالای جایگزین و تعویضی (اگر مشتری لباس دیگری می‌برد):
                      </h4>
                      {totalExchangeValue > 0 && (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          ارزش کالای جدید: + {formatToman(totalExchangeValue)}
                        </span>
                      )}
                    </div>

                    {/* فرم افزودن جنس تعویضی از انبار */}
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-8">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            انتخاب لباس از انبار بوتیک:
                          </label>
                          <select
                            value={selectedExchangeProdId}
                            onChange={(e) => setSelectedExchangeProdId(e.target.value)}
                            className="w-full text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                          >
                            <option value="">-- انتخاب لباس تعویضی --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} | موجودی: {p.stock_quantity} عدد | {formatToman(p.selling_price)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            تعداد:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={exchangeItemQty}
                            onChange={(e) => setExchangeItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full text-xs font-bold text-center px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div className="sm:col-span-2 flex items-end">
                          <button
                            type="button"
                            onClick={handleAddExchangeItem}
                            disabled={!selectedExchangeProdId}
                            className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            افزودن
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* لیست کالاهای تعویضی انتخاب شده */}
                    {exchangeItems.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-500 block">
                          اجناس تعویضی انتخاب‌شده برای تحویل به مشتری:
                        </span>
                        {exchangeItems.map((ex) => (
                          <div
                            key={ex.productId}
                            className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{ex.productName}</span>
                              <span className="text-slate-500 text-[11px] mr-2">
                                ({formatNumber(ex.quantity)} عدد × {formatToman(ex.unitPrice)})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <strong className="text-emerald-700 font-black">
                                {formatToman(ex.quantity * ex.unitPrice)}
                              </strong>
                              <button
                                type="button"
                                onClick={() => handleRemoveExchangeItem(ex.productId)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="حذف این جنس تعویضی"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* بخش ۳: تراز مالی و مابه‌التفاوت آنلاین */}
                  {(totalReturnValue > 0 || totalExchangeValue > 0) && (
                    <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                        <span className="text-slate-300">مجموع ارزش کالاهای مرجوعی:</span>
                        <span className="font-bold text-rose-400">- {formatToman(totalReturnValue)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                        <span className="text-slate-300">مجموع ارزش کالاهای تعویضی جدید:</span>
                        <span className="font-bold text-emerald-400">+ {formatToman(totalExchangeValue)}</span>
                      </div>

                      {/* وضعیت مابه‌التفاوت */}
                      {netDifference > 0 ? (
                        <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-amber-400 font-extrabold text-sm">
                            <span>مابه‌التفاوت (مشتری باید اضافه پرداخت کند):</span>
                            <span className="text-base text-amber-300">+{formatToman(netDifference)}</span>
                          </div>

                          <div className="pt-2 border-t border-amber-500/20 text-xs text-slate-200 space-y-1.5">
                            <span className="block font-bold text-slate-300">نحوه تسویه مابه‌التفاوت:</span>
                            <div className="flex flex-wrap gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="diffMode"
                                  checked={diffPaymentMode === 'cash_received'}
                                  onChange={() => setDiffPaymentMode('cash_received')}
                                  className="accent-amber-500"
                                />
                                <span>دریافت نقدی / پوز کارتخوان در لحظه</span>
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="diffMode"
                                  checked={diffPaymentMode === 'debt_added'}
                                  onChange={() => setDiffPaymentMode('debt_added')}
                                  className="accent-amber-500"
                                />
                                <span>افزودن به بدهی/نسیه مشتری</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      ) : netDifference < 0 ? (
                        <div className="bg-emerald-500/15 border border-emerald-500/30 p-3 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-emerald-400 font-extrabold text-sm">
                            <span>مابه‌التفاوت (بوتیک باید به مشتری عودت دهد):</span>
                            <span className="text-base text-emerald-300">-{formatToman(Math.abs(netDifference))}</span>
                          </div>

                          <div className="pt-2 border-t border-emerald-500/20 text-xs text-slate-200 space-y-1.5">
                            <span className="block font-bold text-slate-300">نحوه تسویه مابه‌التفاوت:</span>
                            <div className="flex flex-wrap gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="radio"
                                  name="diffMode"
                                  checked={diffPaymentMode === 'refund_paid'}
                                  onChange={() => setDiffPaymentMode('refund_paid')}
                                  className="accent-emerald-500"
                                />
                                <span>عودت وجه نقدی / کارت‌به‌کارت به مشتری</span>
                              </label>

                              {editingInvoice.customer_id && (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="diffMode"
                                    checked={diffPaymentMode === 'debt_deducted'}
                                    onChange={() => setDiffPaymentMode('debt_deducted')}
                                    className="accent-emerald-500"
                                  />
                                  <span>کسر از مانده بدهی مشتری</span>
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-500/15 border border-blue-500/30 p-2.5 rounded-xl text-center text-xs text-blue-300 font-bold">
                          ✓ تعویض هم‌قیمت (سر به سر بدون نیاز به پرداخت یا عودت مابه‌التفاوت)
                        </div>
                      )}
                    </div>
                  )}

                  {/* بخش ۴: توضیحات و علت تعویض */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      توضیحات و علت تعویض یا مرجوعی (اختیاری):
                    </label>
                    <input
                      type="text"
                      value={exchangeReason}
                      onChange={(e) => setExchangeReason(e.target.value)}
                      placeholder="مثال: تعویض سایز M به L، تغییر مدل به هودی دورس نایک..."
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </>
              ) : (
                /* ویرایش عمومی فاکتور مخصوص مدیر */
                <div className="space-y-3.5">
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
                      یادداشت کلی فاکتور
                    </label>
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="توضیحات یا یادداشت‌های فاکتور..."
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* دکمه‌های تایید و بستن مودال */}
              <div className="flex gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-2 py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isUpdating
                    ? 'در حال ذخیره و اصلاح انبار...'
                    : (totalReturnValue > 0 || totalExchangeValue > 0)
                    ? 'ثبت تعویض و اصلاح انبار'
                    : 'ذخیره فاکتور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
