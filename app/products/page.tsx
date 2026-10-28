'use client';

import { useState, useEffect } from 'react';
import { Product, Category } from '@/types/database';
import { 
  getProducts, 
  getCategories, 
  addProduct, 
  updateProduct,
  deleteProduct,
  updateProductStock, 
  addCategory,
  updateCategory,
  deleteCategory
} from '@/lib/dataService';
import { useAuth } from '@/lib/authContext';
import { formatToman, formatNumber, parsePersianNumber } from '@/lib/utils';
import { 
  Package, 
  Plus, 
  FolderPlus, 
  Search, 
  PlusCircle, 
  MinusCircle, 
  Check, 
  X,
  Layers,
  Edit2,
  Trash2,
  AlertTriangle,
  FolderEdit,
  Save
} from 'lucide-react';

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<string>('all');
  
  // وضعیت مودال افزودن محصول
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [stock, setStock] = useState('10');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // وضعیت مودال ویرایش محصول
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editPurchasePrice, setEditPurchasePrice] = useState('');
  const [editSellingPrice, setEditSellingPrice] = useState('');
  const [editBarcode, setEditBarcode] = useState('');

  // وضعیت مودال مدیریت کامل دسته‌بندی‌ها (افزودن، ویرایش، حذف)
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([getProducts(), getCategories()]);
      setProducts(p);
      setCategories(c);
      if (c.length > 0 && !categoryId) {
        setCategoryId(c[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStockChange = async (productId: string, currentStock: number, delta: number) => {
    const updated = Math.max(0, currentStock + delta);
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock_quantity: updated } : p))
    );
    await updateProductStock(productId, updated);
  };

  // ۱. ثبت محصول جدید
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await addProduct({
        name: name.trim(),
        category_id: categoryId || null,
        stock_quantity: parsePersianNumber(stock) || 0,
        purchase_price: isAdmin ? (parsePersianNumber(purchasePrice) || 0) : 0,
        selling_price: parsePersianNumber(sellingPrice) || 0,
        barcode: barcode.trim() || undefined,
      });

      setProducts([created, ...products]);
      setShowAddModal(false);
      setName('');
      setStock('10');
      setPurchasePrice('');
      setSellingPrice('');
      setBarcode('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ثبت محصول');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ۲. باز کردن مودال ویرایش محصول
  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setEditName(prod.name);
    setEditCategoryId(prod.category_id || '');
    setEditStock(prod.stock_quantity.toString());
    setEditPurchasePrice(prod.purchase_price.toString());
    setEditSellingPrice(prod.selling_price.toString());
    setEditBarcode(prod.barcode || '');
    setShowEditModal(true);
  };

  // ۳. ثبت ویرایش محصول
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName.trim()) return;

    setIsSubmitting(true);
    try {
      const updated = await updateProduct(editingProduct.id, {
        name: editName.trim(),
        category_id: editCategoryId || null,
        stock_quantity: parsePersianNumber(editStock) || 0,
        purchase_price: isAdmin ? (parsePersianNumber(editPurchasePrice) || 0) : editingProduct.purchase_price,
        selling_price: parsePersianNumber(editSellingPrice) || 0,
        barcode: editBarcode.trim() || null,
      });

      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setShowEditModal(false);
      setEditingProduct(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ویرایش محصول');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ۴. حذف محصول
  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`آیا از حذف محصول «${prod.name}» اطمینان دارید؟`)) {
      return;
    }

    try {
      await deleteProduct(prod.id);
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در حذف محصول');
    }
  };

  // ۵. ایجاد دسته‌بندی جدید
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const cat = await addCategory(newCatName.trim());
      setCategories([...categories, cat]);
      setCategoryId(cat.id);
      setNewCatName('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ثبت دسته');
    }
  };

  // ۶. ذخیره ویرایش نام دسته‌بندی
  const handleSaveEditCategory = async (catId: string) => {
    if (!editingCatName.trim()) return;
    try {
      const updated = await updateCategory(catId, editingCatName.trim());
      setCategories((prev) => prev.map((c) => (c.id === catId ? updated : c)));
      setEditingCatId(null);
      setEditingCatName('');
      // به‌روزرسانی نام دسته در لیست محصولات
      setProducts((prev) =>
        prev.map((p) => (p.category_id === catId ? { ...p, category: updated } : p))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در ویرایش دسته');
    }
  };

  // ۷. حذف دسته‌بندی
  const handleDeleteCategory = async (cat: Category) => {
    const attachedCount = products.filter((p) => p.category_id === cat.id).length;
    let confirmMsg = `آیا از حذف دسته‌بندی «${cat.name}» اطمینان دارید؟`;
    if (attachedCount > 0) {
      confirmMsg += `\nتوجه: ${attachedCount} کالا در این دسته قرار دارند و پس از حذف، بدون دسته‌بندی خواهند شد.`;
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setProducts((prev) =>
        prev.map((p) => (p.category_id === cat.id ? { ...p, category_id: null, category: null } : p))
      );
      if (filterCat === cat.id) setFilterCat('all');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطا در حذف دسته');
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = filterCat === 'all' || p.category_id === filterCat;
    const matchesSearch =
      !search.trim() || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* هدر بخش انبارداری */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            انبارداری و مدیریت اجناس بوتیک
          </h2>
          <p className="text-xs text-slate-500">
            {isAdmin 
              ? 'ثبت و ویرایش البسه، کنترل قیمت خرید، سود هر قلم و تغییر موجودی'
              : 'ثبت و ویرایش البسه، قیمت فروش و تغییر موجودی انبار'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCatModal(true)}
            className="flex-1 sm:flex-initial py-2.5 px-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FolderEdit className="w-4 h-4 text-amber-600" />
            مدیریت دسته‌بندی‌ها
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-initial py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            + افزودن جنس جدید
          </button>
        </div>
      </div>

      {/* نوار جستجو و فیلتر دسته */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی لباس در انبار..."
            className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* لیست کشویی دسته‌بندی */}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-700"
        >
          <option value="all">📁 همه دسته‌ها ({products.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* لیست کالاهای موجود در انبار */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
          <p className="font-bold text-slate-600">کالایی یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-300 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                    {prod.category?.name || 'دسته‌بندی نشده'}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900">{prod.name}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  {/* نمایش قیمت خرید و سود فقط برای مدیر (مهران) */}
                  {isAdmin && (
                    <span>
                      قیمت خرید: <strong className="text-slate-700">{formatToman(prod.purchase_price)}</strong>
                    </span>
                  )}
                  <span>
                    قیمت فروش: <strong className="text-amber-600">{formatToman(prod.selling_price)}</strong>
                  </span>
                  {isAdmin && (
                    <span>
                      سود هر قلم:{' '}
                      <strong className="text-emerald-600 font-bold">
                        {formatToman(prod.selling_price - prod.purchase_price)}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {/* بخش دکمه‌های عملیاتی (ویرایش، حذف و کنترل موجودی) */}
              <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {/* دکمه‌های ویرایش و حذف */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(prod)}
                    className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-slate-200/80 transition-colors"
                    title="ویرایش کالا"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(prod)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200/80 transition-colors"
                    title="حذف کالا"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* کنترل موجودی سریع لمسی (+ و -) */}
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleStockChange(prod.id, prod.stock_quantity, 1)}
                    className="p-1.5 rounded-lg bg-white shadow-sm hover:bg-emerald-500 hover:text-white text-slate-700 transition-colors"
                    title="افزایش ۱ عدد به موجودی"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>

                  <span className="px-2 font-black text-sm text-slate-900 min-w-8 text-center">
                    {formatNumber(prod.stock_quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleStockChange(prod.id, prod.stock_quantity, -1)}
                    className="p-1.5 rounded-lg bg-white shadow-sm hover:bg-red-500 hover:text-white text-slate-700 transition-colors"
                    title="کاهش ۱ عدد از موجودی"
                  >
                    <MinusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مودال افزودن جنس جدید */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                ثبت جنس جدید در انبار
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام کامل لباس <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: هودی دورس سه‌نخ زارا طوسی"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  دسته‌بندی (انتخاب کشویی)
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                {/* قیمت خرید فقط برای مدیر نمایش داده می‌شود */}
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      قیمت خرید (تومان)
                    </label>
                    <input
                      type="text"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(e.target.value)}
                      placeholder="مثال: 350000"
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    قیمت فروش (تومان) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="مثال: 680000"
                    className="w-full text-sm font-bold text-amber-700 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تعداد موجودی اولیه
                </label>
                <input
                  type="text"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full text-sm font-bold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isSubmitting ? 'در حال ثبت...' : 'ثبت در انبار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال ویرایش محصول */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                ویرایش مشخصات کالا
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام کامل لباس <span className="text-red-500">*</span>
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
                  دسته‌بندی
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                >
                  <option value="">بدون دسته</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
                {isAdmin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      قیمت خرید (تومان)
                    </label>
                    <input
                      type="text"
                      value={editPurchasePrice}
                      onChange={(e) => setEditPurchasePrice(e.target.value)}
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    قیمت فروش (تومان) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editSellingPrice}
                    onChange={(e) => setEditSellingPrice(e.target.value)}
                    className="w-full text-sm font-bold text-amber-700 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  موجودی فعلی در انبار
                </label>
                <input
                  type="text"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full text-sm font-bold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال جامع مدیریت دسته‌بندی‌ها (مشاهده، افزودن، ویرایش و حذف دسته‌ها) */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                مدیریت دسته‌بندی‌های لباس
              </h3>
              <button
                onClick={() => {
                  setShowCatModal(false);
                  setEditingCatId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* فرم ثبت دسته جدید */}
            <form onSubmit={handleCreateCategory} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="نام دسته جدید (مثال: اکسسوری، جوراب...)"
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                ثبت دسته
              </button>
            </form>

            {/* لیست دسته‌ها با امکان ویرایش نام و حذف */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <h4 className="text-xs font-bold text-slate-500 mb-1">
                دسته‌های موجود ({categories.length} دسته):
              </h4>
              {categories.map((c) => {
                const count = products.filter((p) => p.category_id === c.id).length;
                const isEditing = editingCatId === c.id;

                return (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          value={editingCatName}
                          onChange={(e) => setEditingCatName(e.target.value)}
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-amber-500 bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditCategory(c.id)}
                          className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                          title="ذخیره"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300"
                          title="انصراف"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800">{c.name}</span>
                          <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                            {formatNumber(count)} کالا
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(c.id);
                              setEditingCatName(c.name);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-colors"
                            title="ویرایش نام دسته"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(c)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                            title="حذف دسته"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t mt-3 text-left">
              <button
                type="button"
                onClick={() => {
                  setShowCatModal(false);
                  setEditingCatId(null);
                }}
                className="py-2 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
