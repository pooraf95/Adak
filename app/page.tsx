'use client';

import { useState, useEffect } from 'react';
import { Category, Product, Customer, CartItem } from '@/types/database';
import { 
  getCategories, 
  getProducts, 
  getCustomers, 
  createInvoice 
} from '@/lib/dataService';
import { formatToman, formatNumber } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  CheckCircle, 
  Store,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Package
} from 'lucide-react';
import InvoiceCheckoutModal from '@/components/InvoiceCheckoutModal';

export default function PosHomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, prods, custs] = await Promise.all([
        getCategories(),
        getProducts(),
        getCustomers(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setCustomers(custs);
    } catch (e) {
      console.error('Failed to load initial POS data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // افزودن کالا به سبد خرید یا افزایش تعداد
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: product.selling_price,
          unit_purchase_price: product.purchase_price,
        },
      ];
    });
  };

  // تغییر تعداد در مودال
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // فیلتر کردن محصولات بر اساس دسته‌بندی و جستجوی اختیاری
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch = !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // جمع کل سبد
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  // ثبت نهایی فاکتور
  const handleFinalSubmit = async (invoiceData: {
    customerId: string | null;
    customerName: string;
    discountAmount: number;
    paidAmount: number;
    notes?: string;
  }) => {
    const inv = await createInvoice({
      customer_id: invoiceData.customerId,
      customer_name: invoiceData.customerName,
      items: cart,
      discount_amount: invoiceData.discountAmount,
      paid_amount: invoiceData.paidAmount,
      notes: invoiceData.notes,
    });

    setCart([]);
    setSuccessNotice(`فاکتور شماره ${inv.invoice_number} برای «${inv.customer_name}» با موفقیت ثبت شد.`);
    setTimeout(() => setSuccessNotice(null), 5000);
    // بازخوانی موجودی کالاها و بدهی مشتریان
    loadData();
  };

  return (
    <div className="space-y-4">

      {/* پیام موفقیت‌آمیز ثبت فاکتور */}
      {successNotice && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold text-sm">{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-xs bg-emerald-700/60 hover:bg-emerald-700 px-3 py-1 rounded-xl font-semibold"
          >
            بستن
          </button>
        </div>
      )}

      {/* نوار فیلتر و دسته‌بندی‌ها به صورت دکمه‌های افقی لمسی بدون نیاز به تایپ */}
      <div className="bg-white p-3 md:p-4 rounded-3xl shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی سریع لباس..."
              className="w-full pl-3 pr-9 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={loadData}
            title="به‌روزرسانی اجناس"
            className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* لیست دسته‌بندی‌ها به صورت تگ‌های افقی قابل اسکرول (کاملاً لمسی) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-amber-400 shadow-md scale-105'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه اجناس ({products.length})
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* گرید محصولات (کارت‌های بزرگ و لمسی مخصوص استفاده در فروشگاه) */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 py-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 bg-slate-200/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">هیچ محصولی یافت نشد</h3>
          <p className="text-xs text-slate-400 mt-1">از منوی «انبار کالا» می‌توانید محصول جدید اضافه کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {filteredProducts.map((prod) => {
            const inCart = cart.find((it) => it.product.id === prod.id);
            const isOutOfStock = prod.stock_quantity <= 0;

            return (
              <div
                key={prod.id}
                onClick={() => handleAddToCart(prod)}
                className={`relative group bg-white rounded-3xl p-3.5 sm:p-4 border transition-all cursor-pointer select-none active:scale-95 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[140px] sm:min-h-[160px] ${
                  inCart
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* برچسب تعداد انتخاب شده در گوشه کارت */}
                {inCart && (
                  <span className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg border-2 border-white">
                    {formatNumber(inCart.quantity)}
                  </span>
                )}

                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {prod.category?.name || 'لباس'}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isOutOfStock
                          ? 'bg-red-100 text-red-600'
                          : prod.stock_quantity < 5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isOutOfStock ? 'اتمام موجودی' : `موجودی: ${formatNumber(prod.stock_quantity)}`}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2 leading-snug">
                    {prod.name}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 block">
                      {formatToman(prod.selling_price)}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center text-slate-700 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نوار چسبان پایین صفحه برای ثبت سریع فاکتور (در صورت پر بودن سبد خرید) */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-16 md:bottom-6 left-0 right-0 z-30 px-3 sm:px-4 max-w-2xl mx-auto animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white rounded-3xl p-3 sm:p-4 shadow-2xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-bold">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-black">
                  {formatNumber(totalCartCount)}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">جمع {formatNumber(totalCartCount)} قلم کالا:</p>
                <p className="font-black text-base text-amber-400">{formatToman(totalCartPrice)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="py-3 px-5 sm:px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <span>تکمیل و ثبت فاکتور</span>
              <span className="text-lg">←</span>
            </button>
          </div>
        </div>
      )}

      {/* مودال تکمیل فاکتور، نسیه، تخفیف و انتخاب مشتری */}
      <InvoiceCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cart}
        customers={customers}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCustomerAdded={(newCust) => setCustomers((prev) => [...prev, newCust])}
        onSubmitInvoice={handleFinalSubmit}
      />
    </div>
  );
}
