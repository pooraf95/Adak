import { supabase, isSupabaseConfigured } from './supabase';
import { Category, Product, Customer, Invoice, InvoiceItem, CartItem, CustomerPayment } from '@/types/database';
import { formatShamsiDate } from './utils';

// کلیدهای ذخیره‌سازی محلی در حالت دمو/آفلاین
const LS_CATEGORIES = 'adak_categories';
const LS_PRODUCTS = 'adak_products';
const LS_CUSTOMERS = 'adak_customers';
const LS_INVOICES = 'adak_invoices';
const LS_PAYMENTS = 'adak_payments';

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'تیشرت و پلوشرت', created_at: new Date().toISOString() },
  { id: '2', name: 'شلوار جین و کتان', created_at: new Date().toISOString() },
  { id: '3', name: 'شلوار اسلش و کارگو', created_at: new Date().toISOString() },
  { id: '4', name: 'پیراهن مردانه', created_at: new Date().toISOString() },
  { id: '5', name: 'هودی و دورس', created_at: new Date().toISOString() },
  { id: '6', name: 'کاپشن و بادگیر', created_at: new Date().toISOString() },
  { id: '7', name: 'کتونی و ونس', created_at: new Date().toISOString() },
  { id: '8', name: 'اکسسوری و کمربند', created_at: new Date().toISOString() },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    category_id: '1',
    name: 'تیشرت اوورسایز بیسیک مشکی نایک',
    stock_quantity: 25,
    purchase_price: 280000,
    selling_price: 480000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p2',
    category_id: '1',
    name: 'تیشرت نخی ساده سفید جردن',
    stock_quantity: 18,
    purchase_price: 240000,
    selling_price: 420000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p3',
    category_id: '2',
    name: 'شلوار جین مام استایل زغالی',
    stock_quantity: 12,
    purchase_price: 520000,
    selling_price: 890000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p4',
    category_id: '2',
    name: 'شلوار کتان کش مشکی راسته',
    stock_quantity: 15,
    purchase_price: 480000,
    selling_price: 820000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p5',
    category_id: '6',
    name: 'بادگیر دورو ضدآب کلاه‌دار',
    stock_quantity: 8,
    purchase_price: 750000,
    selling_price: 1350000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p6',
    category_id: '7',
    name: 'کتونی نیوبالانس ۵۵۰ سفید سبز',
    stock_quantity: 6,
    purchase_price: 850000,
    selling_price: 1580000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'علی رضایی',
    phone: '09121112233',
    total_debt: 450000,
    notes: 'مشتری ثابت، خوش‌حساب',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'محمدرضا کاظمی',
    phone: '09358889900',
    total_debt: 0,
    notes: 'علاقه‌مند به تیشرت اوورسایز',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'c3',
    name: 'پوریا اکبری',
    phone: '09194445566',
    total_debt: 1200000,
    notes: 'تسویه آخر ماه',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  try {
    return JSON.parse(data) as T;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, data: T) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// ======================= ۱. دسته‌بندی‌ها =======================
export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (!error && data) return data;
  }
  return getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
}

export async function addCategory(name: string): Promise<Category> {
  const cleanName = name.trim();
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: cleanName })
      .select()
      .single();
    if (!error && data) return data;
    throw new Error(error?.message || 'خطا در ثبت دسته');
  }

  const list = getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
  const exists = list.find((c) => c.name === cleanName);
  if (exists) return exists;

  const newItem: Category = {
    id: 'cat_' + Date.now(),
    name: cleanName,
    created_at: new Date().toISOString(),
  };
  setLocal(LS_CATEGORIES, [...list, newItem]);
  return newItem;
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const cleanName = name.trim();
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('categories')
      .update({ name: cleanName })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data;
    throw new Error(error?.message || 'خطا در ویرایش دسته');
  }

  const list = getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
  const updatedList = list.map((c) => (c.id === id ? { ...c, name: cleanName } : c));
  setLocal(LS_CATEGORIES, updatedList);
  return updatedList.find((c) => c.id === id)!;
}

export async function deleteCategory(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const list = getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
  setLocal(LS_CATEGORIES, list.filter((c) => c.id !== id));

  // همچنین دسته محصولات متصل را در حالت آفلاین پاک می‌کنیم
  const products = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
  const updatedProds = products.map((p) => (p.category_id === id ? { ...p, category_id: null, category: null } : p));
  setLocal(LS_PRODUCTS, updatedProds);
}

// ======================= ۲. محصولات و انبار =======================
export async function getProducts(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  const products = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
  const categories = getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
  return products.map((p) => ({
    ...p,
    category: categories.find((c) => c.id === p.category_id) || null,
  }));
}

export async function addProduct(prod: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: prod.name,
        category_id: prod.category_id,
        stock_quantity: prod.stock_quantity,
        purchase_price: prod.purchase_price,
        selling_price: prod.selling_price,
        barcode: prod.barcode || null,
      })
      .select('*, category:categories(*)')
      .single();
    if (!error && data) return data;
    throw new Error(error?.message || 'خطا در ثبت محصول');
  }

  const list = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
  const categories = getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
  const newItem: Product = {
    ...prod,
    id: 'prod_' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    category: categories.find((c) => c.id === prod.category_id) || null,
  };
  setLocal(LS_PRODUCTS, [newItem, ...list]);
  return newItem;
}

export async function updateProductStock(id: string, newStock: number): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('products').update({ stock_quantity: newStock, updated_at: new Date().toISOString() }).eq('id', id);
    return;
  }
  const list = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
  const updated = list.map((p) => (p.id === id ? { ...p, stock_quantity: newStock, updated_at: new Date().toISOString() } : p));
  setLocal(LS_PRODUCTS, updated);
}

export async function updateProduct(
  id: string,
  prod: Partial<Omit<Product, 'id' | 'created_at'>>
): Promise<Product> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...prod,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();
    if (!error && data) return data;
    throw new Error(error?.message || 'خطا در ویرایش محصول');
  }

  const list = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
  const categories = getLocal<Category[]>(LS_CATEGORIES, INITIAL_CATEGORIES);
  const updatedList = list.map((p) => {
    if (p.id === id) {
      const updated = { ...p, ...prod, updated_at: new Date().toISOString() };
      if (prod.category_id !== undefined) {
        updated.category = categories.find((c) => c.id === prod.category_id) || null;
      }
      return updated;
    }
    return p;
  });
  setLocal(LS_PRODUCTS, updatedList);
  return updatedList.find((p) => p.id === id)!;
}

export async function deleteProduct(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const list = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
  setLocal(LS_PRODUCTS, list.filter((p) => p.id !== id));
}

// ======================= ۳. مشتریان =======================
export async function getCustomers(): Promise<Customer[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from('customers').select('*').order('name');
    if (!error && data) return data;
  }
  return getLocal<Customer[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
}

export async function addCustomer(cust: { name: string; phone?: string; notes?: string }): Promise<Customer> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: cust.name.trim(),
        phone: cust.phone?.trim() || null,
        notes: cust.notes || null,
        total_debt: 0,
      })
      .select()
      .single();
    if (!error && data) return data;
    throw new Error(error?.message || 'خطا در ثبت مشتری');
  }

  const list = getLocal<Customer[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
  const newItem: Customer = {
    id: 'cust_' + Date.now(),
    name: cust.name.trim(),
    phone: cust.phone?.trim() || null,
    total_debt: 0,
    notes: cust.notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  setLocal(LS_CUSTOMERS, [...list, newItem]);
  return newItem;
}

// ثبت تسویه/پرداخت بدهی مشتری
export async function payCustomerDebt(
  customerId: string,
  amount: number,
  paymentMethod: string = 'کارتخوان',
  notes?: string
): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from('customer_payments').insert({
      customer_id: customerId,
      amount,
      payment_method: paymentMethod,
      notes,
    });
    return;
  }

  const customers = getLocal<Customer[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
  const updatedCusts = customers.map((c) => {
    if (c.id === customerId) {
      return {
        ...c,
        total_debt: Math.max(0, c.total_debt - amount),
        updated_at: new Date().toISOString(),
      };
    }
    return c;
  });
  setLocal(LS_CUSTOMERS, updatedCusts);

  const payments = getLocal<CustomerPayment[]>(LS_PAYMENTS, []);
  payments.push({
    id: 'pay_' + Date.now(),
    customer_id: customerId,
    amount,
    payment_method: paymentMethod,
    notes,
    created_at: new Date().toISOString(),
  });
  setLocal(LS_PAYMENTS, payments);
}

export async function updateCustomer(
  id: string,
  cust: { name: string; phone?: string; notes?: string }
): Promise<Customer> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: cust.name.trim(),
        phone: cust.phone?.trim() || null,
        notes: cust.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) return data;
    throw new Error(error?.message || 'خطا در ویرایش مشتری');
  }

  const list = getLocal<Customer[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
  const updated = list.map((c) =>
    c.id === id
      ? {
          ...c,
          name: cust.name.trim(),
          phone: cust.phone?.trim() || null,
          notes: cust.notes || null,
          updated_at: new Date().toISOString(),
        }
      : c
  );
  setLocal(LS_CUSTOMERS, updated);
  return updated.find((c) => c.id === id)!;
}

export async function deleteCustomer(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  const list = getLocal<Customer[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
  setLocal(LS_CUSTOMERS, list.filter((c) => c.id !== id));
}

// ======================= ۴. فاکتورهای فروش =======================
export async function getInvoices(): Promise<Invoice[]> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(*), items:invoice_items(*)')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  return getLocal<Invoice[]>(LS_INVOICES, []);
}

export async function createInvoice(params: {
  customer_id: string | null;
  customer_name: string;
  items: CartItem[];
  discount_amount: number;
  paid_amount: number;
  notes?: string;
}): Promise<Invoice> {
  const total_amount = params.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const total_purchase_cost = params.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_purchase_price,
    0
  );
  const discount_amount = Math.min(params.discount_amount, total_amount);
  const final_amount = Math.max(0, total_amount - discount_amount);
  const paid_amount = Math.min(params.paid_amount, final_amount);
  const debt_amount = final_amount - paid_amount;
  const net_profit = final_amount - total_purchase_cost;

  let payment_status: 'paid' | 'partial' | 'credit' = 'paid';
  if (debt_amount === 0) {
    payment_status = 'paid';
  } else if (paid_amount > 0 && debt_amount > 0) {
    payment_status = 'partial';
  } else {
    payment_status = 'credit';
  }

  if (isSupabaseConfigured()) {
    // ۱. ثبت فاکتور
    const { data: invoiceData, error: invoiceErr } = await supabase
      .from('invoices')
      .insert({
        customer_id: params.customer_id,
        customer_name: params.customer_name,
        total_amount,
        discount_amount,
        final_amount,
        paid_amount,
        debt_amount,
        payment_status,
        total_purchase_cost,
        net_profit,
        notes: params.notes || null,
      })
      .select()
      .single();

    if (invoiceErr || !invoiceData) {
      throw new Error(invoiceErr?.message || 'خطا در ثبت فاکتور');
    }

    // ۲. ثبت اقلام فاکتور
    const invoiceItems = params.items.map((it) => ({
      invoice_id: invoiceData.id,
      product_id: it.product.id,
      product_name: it.product.name,
      quantity: it.quantity,
      unit_price: it.unit_price,
      unit_purchase_price: it.unit_purchase_price,
      total_price: it.quantity * it.unit_price,
      total_purchase_cost: it.quantity * it.unit_purchase_price,
    }));

    const { error: itemsErr } = await supabase.from('invoice_items').insert(invoiceItems);
    if (itemsErr) {
      console.error('Error inserting invoice items:', itemsErr);
    }

    return invoiceData;
  }

  // ذخیره‌سازی محلی برای دمو
  const currentInvoices = getLocal<Invoice[]>(LS_INVOICES, []);
  const newInvoiceNumber = currentInvoices.length + 1001;
  const invoiceId = 'inv_' + Date.now();

  const formattedItems: InvoiceItem[] = params.items.map((it) => ({
    id: 'item_' + Math.random(),
    invoice_id: invoiceId,
    product_id: it.product.id,
    product_name: it.product.name,
    quantity: it.quantity,
    unit_price: it.unit_price,
    unit_purchase_price: it.unit_purchase_price,
    total_price: it.quantity * it.unit_price,
    total_purchase_cost: it.quantity * it.unit_purchase_price,
  }));

  const newInvoice: Invoice = {
    id: invoiceId,
    invoice_number: newInvoiceNumber,
    customer_id: params.customer_id,
    customer_name: params.customer_name,
    total_amount,
    discount_amount,
    final_amount,
    paid_amount,
    debt_amount,
    payment_status,
    total_purchase_cost,
    net_profit,
    notes: params.notes,
    created_at: new Date().toISOString(),
    items: formattedItems,
  };

  // کسر موجودی انبار به صورت محلی
  const products = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
  params.items.forEach((item) => {
    const p = products.find((x) => x.id === item.product.id);
    if (p) {
      p.stock_quantity = Math.max(0, p.stock_quantity - item.quantity);
      p.updated_at = new Date().toISOString();
    }
  });
  setLocal(LS_PRODUCTS, products);

  // افزودن بدهی مشتری به صورت محلی
  if (params.customer_id && debt_amount > 0) {
    const customers = getLocal<Customer[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
    const c = customers.find((x) => x.id === params.customer_id);
    if (c) {
      c.total_debt += debt_amount;
      c.updated_at = new Date().toISOString();
      setLocal(LS_CUSTOMERS, customers);
    }
  }

  setLocal(LS_INVOICES, [newInvoice, ...currentInvoices]);
  return newInvoice;
}

export async function deleteInvoice(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    // دریافت اطلاعات فاکتور جهت کسر بدهی در صورت وجود
    const { data: inv } = await supabase
      .from('invoices')
      .select('*, items:invoice_items(*)')
      .eq('id', id)
      .single();

    if (inv) {
      // اگر مشتری بدهی حاصل از این فاکتور داشت، از کل بدهی کسر شود
      if (inv.customer_id && inv.debt_amount > 0) {
        const { data: cust } = await supabase
          .from('customers')
          .select('total_debt')
          .eq('id', inv.customer_id)
          .single();
        if (cust) {
          await supabase
            .from('customers')
            .update({
              total_debt: Math.max(0, cust.total_debt - inv.debt_amount),
              updated_at: new Date().toISOString(),
            })
            .eq('id', inv.customer_id);
        }
      }
    }

    // حذف اقلام (تریگر tr_restore_product_stock دیتابیس به صورت خودکار موجودی انبار را بازمی‌گرداند)
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    const { error } = await supabase.from('invoices').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }

  // حذف به صورت محلی
  const invoices = getLocal<Invoice[]>(LS_INVOICES, []);
  const targetInvoice = invoices.find((inv) => inv.id === id);

  if (targetInvoice) {
    // بازگرداندن موجودی کالاها به انبار
    const products = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
    if (targetInvoice.items) {
      targetInvoice.items.forEach((item) => {
        const p = products.find((x) => x.id === item.product_id);
        if (p) {
          p.stock_quantity += item.quantity;
          p.updated_at = new Date().toISOString();
        }
      });
      setLocal(LS_PRODUCTS, products);
    }

    // اصلاح بدهی مشتری در صورت وجود
    if (targetInvoice.customer_id && targetInvoice.debt_amount > 0) {
      const customers = getLocal<Customer[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
      const c = customers.find((x) => x.id === targetInvoice.customer_id);
      if (c) {
        c.total_debt = Math.max(0, c.total_debt - targetInvoice.debt_amount);
        c.updated_at = new Date().toISOString();
        setLocal(LS_CUSTOMERS, customers);
      }
    }
  }

  setLocal(LS_INVOICES, invoices.filter((inv) => inv.id !== id));
}

export async function updateInvoice(
  id: string,
  updates: {
    customer_name?: string;
    notes?: string;
    paid_amount?: number;
    payment_status?: 'paid' | 'partial' | 'credit';
  }
): Promise<Invoice> {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select('*, customer:customers(*), items:invoice_items(*)')
      .single();
    if (!error && data) return data;
    throw new Error(error?.message || 'خطا در ویرایش فاکتور');
  }

  const invoices = getLocal<Invoice[]>(LS_INVOICES, []);
  const updatedList = invoices.map((inv) => {
    if (inv.id === id) {
      const updatedInv = { ...inv, ...updates };
      if (updates.paid_amount !== undefined) {
        updatedInv.debt_amount = Math.max(0, updatedInv.final_amount - updates.paid_amount);
        if (updatedInv.debt_amount === 0) {
          updatedInv.payment_status = 'paid';
        } else if (updates.paid_amount > 0) {
          updatedInv.payment_status = 'partial';
        } else {
          updatedInv.payment_status = 'credit';
        }
      }
      return updatedInv;
    }
    return inv;
  });
  setLocal(LS_INVOICES, updatedList);
  return updatedList.find((inv) => inv.id === id)!;
}

// ثبت تعویض و مرجوعی کالا در فاکتور با اصلاح خودکار موجودی انبار و محاسبات مالی
export interface ProcessExchangeParams {
  invoiceId: string;
  returnedItems: {
    productId: string;
    productName: string;
    quantityToReturn: number;
    unitPrice: number;
    unitPurchasePrice: number;
  }[];
  newExchangeItems: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    unitPurchasePrice: number;
  }[];
  differenceMode: 'cash_received' | 'debt_added' | 'refund_paid' | 'debt_deducted' | 'even';
  differenceAmount: number;
  operatorName: string;
  customerName?: string;
  customNotes?: string;
}

export async function processInvoiceExchangeOrReturn(params: ProcessExchangeParams): Promise<Invoice> {
  const {
    invoiceId,
    returnedItems,
    newExchangeItems,
    differenceMode,
    differenceAmount,
    operatorName,
    customerName,
    customNotes,
  } = params;

  // ۱. دریافت فاکتور فعلی
  let currentInvoice: Invoice | null = null;
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(*), items:invoice_items(*)')
      .eq('id', invoiceId)
      .single();
    if (error || !data) throw new Error('فاکتور برای تعویض/مرجوعی یافت نشد.');
    currentInvoice = data;
  } else {
    const list = getLocal<Invoice[]>(LS_INVOICES, []);
    currentInvoice = list.find((inv) => inv.id === invoiceId) || null;
  }

  if (!currentInvoice) {
    throw new Error('فاکتور برای تعویض/مرجوعی یافت نشد.');
  }

  const existingItems = currentInvoice.items || [];

  // ۲. محاسبه اقلام به‌روزرسانی شده
  const remainingItems: Omit<InvoiceItem, 'id'>[] = [];
  existingItems.forEach((it) => {
    const ret = returnedItems.find((r) => r.productId === it.product_id);
    const returnQty = ret ? Math.min(it.quantity, ret.quantityToReturn) : 0;
    const remainingQty = it.quantity - returnQty;
    if (remainingQty > 0) {
      remainingItems.push({
        invoice_id: invoiceId,
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: remainingQty,
        unit_price: it.unit_price,
        unit_purchase_price: it.unit_purchase_price,
        total_price: remainingQty * it.unit_price,
        total_purchase_cost: remainingQty * it.unit_purchase_price,
      });
    }
  });

  const newlyAddedItems: Omit<InvoiceItem, 'id'>[] = newExchangeItems
    .filter((x) => x.quantity > 0)
    .map((x) => ({
      invoice_id: invoiceId,
      product_id: x.productId,
      product_name: x.productName,
      quantity: x.quantity,
      unit_price: x.unitPrice,
      unit_purchase_price: x.unitPurchasePrice,
      total_price: x.quantity * x.unitPrice,
      total_purchase_cost: x.quantity * x.unitPurchasePrice,
    }));

  const allUpdatedItems = [...remainingItems, ...newlyAddedItems];

  // ۳. محاسبه مبالغ جدید
  const newTotalAmount = allUpdatedItems.reduce((sum, item) => sum + item.total_price, 0);
  const newTotalPurchaseCost = allUpdatedItems.reduce(
    (sum, item) => sum + item.total_purchase_cost,
    0
  );
  const originalDiscount = currentInvoice.discount_amount || 0;
  const newDiscountAmount = Math.min(originalDiscount, newTotalAmount);
  const newFinalAmount = Math.max(0, newTotalAmount - newDiscountAmount);

  let newPaidAmount = currentInvoice.paid_amount;
  let newDebtAmount = currentInvoice.debt_amount;

  if (differenceMode === 'cash_received') {
    newPaidAmount = currentInvoice.paid_amount + differenceAmount;
    newDebtAmount = Math.max(0, newFinalAmount - newPaidAmount);
  } else if (differenceMode === 'debt_added') {
    newDebtAmount = currentInvoice.debt_amount + differenceAmount;
  } else if (differenceMode === 'refund_paid') {
    newPaidAmount = Math.max(0, currentInvoice.paid_amount - differenceAmount);
    newDebtAmount = Math.max(0, newFinalAmount - newPaidAmount);
  } else if (differenceMode === 'debt_deducted') {
    newDebtAmount = Math.max(0, currentInvoice.debt_amount - differenceAmount);
  } else if (differenceMode === 'even') {
    newPaidAmount = Math.min(currentInvoice.paid_amount, newFinalAmount);
    newDebtAmount = Math.max(0, newFinalAmount - newPaidAmount);
  }

  let payment_status: 'paid' | 'partial' | 'credit' = 'paid';
  if (newDebtAmount === 0) {
    payment_status = 'paid';
  } else if (newPaidAmount > 0) {
    payment_status = 'partial';
  } else {
    payment_status = 'credit';
  }
  const netProfit = newFinalAmount - newTotalPurchaseCost;

  // ۴. ساخت یادداشت رسمی تغییرات فاکتور
  const nowShamsi = formatShamsiDate(new Date().toISOString());
  const returnedSummary = returnedItems
    .filter((r) => r.quantityToReturn > 0)
    .map((r) => `${r.quantityToReturn} عدد ${r.productName}`)
    .join('، ');
  const exchangeSummary = newExchangeItems
    .filter((x) => x.quantity > 0)
    .map((x) => `${x.quantity} عدد ${x.productName}`)
    .join('، ');

  let diffSummary = '';
  if (differenceAmount > 0) {
    if (differenceMode === 'cash_received') diffSummary = `(مابه‌التفاوت: +${differenceAmount.toLocaleString('fa-IR')} تومان نقدی دریافت شد)`;
    else if (differenceMode === 'debt_added') diffSummary = `(مابه‌التفاوت: +${differenceAmount.toLocaleString('fa-IR')} تومان به نسیه افزوده شد)`;
    else if (differenceMode === 'refund_paid') diffSummary = `(مابه‌التفاوت: -${differenceAmount.toLocaleString('fa-IR')} تومان به مشتری عودت شد)`;
    else if (differenceMode === 'debt_deducted') diffSummary = `(مابه‌التفاوت: -${differenceAmount.toLocaleString('fa-IR')} تومان از بدهی کسر شد)`;
  } else {
    diffSummary = '(تعویض سر به سر بدون مابه‌التفاوت)';
  }

  const parts = [];
  if (returnedSummary) parts.push(`مرجوعی: ${returnedSummary}`);
  if (exchangeSummary) parts.push(`تعویض با: ${exchangeSummary}`);
  parts.push(diffSummary);

  const actionLog = `[تعویض/مرجوعی (${operatorName} - ${nowShamsi}): ${parts.join(' | ')}]`;
  const finalNotes = [currentInvoice.notes, actionLog, customNotes?.trim()].filter(Boolean).join('\n');

  // ۵. ذخیره‌سازی در سوپابیس
  if (isSupabaseConfigured()) {
    // حذف اقلام قبلی (تریگر دیتابیس اقلام قبلی را به موجودی برمی‌گرداند)
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);

    // درج اقلام باقیمانده و جدید (تریگر دیتابیس اقلام جدید را از موجودی کسر می‌کند)
    if (allUpdatedItems.length > 0) {
      const { error: itemsErr } = await supabase.from('invoice_items').insert(
        allUpdatedItems.map((it) => ({
          invoice_id: invoiceId,
          product_id: it.product_id,
          product_name: it.product_name,
          quantity: it.quantity,
          unit_price: it.unit_price,
          unit_purchase_price: it.unit_purchase_price,
          total_price: it.total_price,
          total_purchase_cost: it.total_purchase_cost,
        }))
      );
      if (itemsErr) console.error('Error inserting updated items:', itemsErr);
    }

    // به‌روزرسانی فاکتور
    const { data: updatedInv, error: invErr } = await supabase
      .from('invoices')
      .update({
        customer_name: customerName?.trim() || currentInvoice.customer_name,
        total_amount: newTotalAmount,
        discount_amount: newDiscountAmount,
        final_amount: newFinalAmount,
        paid_amount: newPaidAmount,
        debt_amount: newDebtAmount,
        payment_status,
        total_purchase_cost: newTotalPurchaseCost,
        net_profit: netProfit,
        notes: finalNotes,
      })
      .eq('id', invoiceId)
      .select('*, customer:customers(*), items:invoice_items(*)')
      .single();

    if (invErr || !updatedInv) {
      throw new Error(invErr?.message || 'خطا در ثبت تعویض فاکتور');
    }

    // به‌روزرسانی مانده بدهی مشتری در جدول customers در صورت تغییر
    const deltaDebt = newDebtAmount - currentInvoice.debt_amount;
    if (currentInvoice.customer_id && deltaDebt !== 0) {
      const { data: cust } = await supabase
        .from('customers')
        .select('total_debt')
        .eq('id', currentInvoice.customer_id)
        .single();
      if (cust) {
        await supabase
          .from('customers')
          .update({
            total_debt: Math.max(0, cust.total_debt + deltaDebt),
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentInvoice.customer_id);
      }
    }

    return updatedInv;
  }

  // ۶. ذخیره‌سازی محلی (حالت آفلاین)
  const products = getLocal<Product[]>(LS_PRODUCTS, INITIAL_PRODUCTS);
  returnedItems.forEach((ret) => {
    if (ret.quantityToReturn > 0) {
      const p = products.find((x) => x.id === ret.productId);
      if (p) {
        p.stock_quantity += ret.quantityToReturn;
        p.updated_at = new Date().toISOString();
      }
    }
  });
  newExchangeItems.forEach((ex) => {
    if (ex.quantity > 0) {
      const p = products.find((x) => x.id === ex.productId);
      if (p) {
        p.stock_quantity = Math.max(0, p.stock_quantity - ex.quantity);
        p.updated_at = new Date().toISOString();
      }
    }
  });
  setLocal(LS_PRODUCTS, products);

  const deltaDebt = newDebtAmount - currentInvoice.debt_amount;
  if (currentInvoice.customer_id && deltaDebt !== 0) {
    const customers = getLocal<Customer[]>(LS_CUSTOMERS, INITIAL_CUSTOMERS);
    const c = customers.find((x) => x.id === currentInvoice!.customer_id);
    if (c) {
      c.total_debt = Math.max(0, c.total_debt + deltaDebt);
      c.updated_at = new Date().toISOString();
      setLocal(LS_CUSTOMERS, customers);
    }
  }

  const updatedInvoiceObj: Invoice = {
    id: currentInvoice.id,
    invoice_number: currentInvoice.invoice_number,
    created_at: currentInvoice.created_at,
    customer_id: currentInvoice.customer_id,
    customer: currentInvoice.customer,
    customer_name: customerName?.trim() || currentInvoice.customer_name,
    total_amount: newTotalAmount,
    discount_amount: newDiscountAmount,
    final_amount: newFinalAmount,
    paid_amount: newPaidAmount,
    debt_amount: newDebtAmount,
    payment_status,
    total_purchase_cost: newTotalPurchaseCost,
    net_profit: netProfit,
    notes: finalNotes,
    items: allUpdatedItems.map((it, idx) => ({ ...it, id: 'item_upd_' + idx + '_' + Date.now() })),
  };

  const invoices = getLocal<Invoice[]>(LS_INVOICES, []);
  setLocal(
    LS_INVOICES,
    invoices.map((inv) => (inv.id === invoiceId ? updatedInvoiceObj : inv))
  );

  return updatedInvoiceObj;
}

// ======================= ۵. گزارش‌گیری (Reports) =======================
export interface ReportSummary {
  invoiceCount: number;
  grossSales: number; // مجموع فروش کلی (مبلغ نهایی فاکتورها)
  netProfit: number;  // سود خالص (فروش منهای بهای تمام شده خرید)
  totalDebt: number;  // مجموع طلب‌های ایجاد شده
}

export async function getReportSummary(timeframe: 'daily' | 'weekly' | 'monthly'): Promise<ReportSummary> {
  const invoices = await getInvoices();
  const now = new Date();
  
  const filtered = invoices.filter((inv) => {
    const date = new Date(inv.created_at);
    if (timeframe === 'daily') {
      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    } else if (timeframe === 'weekly') {
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    } else {
      // ماهانه (۳۰ روز گذشته)
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 30;
    }
  });

  return {
    invoiceCount: filtered.length,
    grossSales: filtered.reduce((sum, inv) => sum + (inv.final_amount || 0), 0),
    netProfit: filtered.reduce((sum, inv) => sum + (inv.net_profit || 0), 0),
    totalDebt: filtered.reduce((sum, inv) => sum + (inv.debt_amount || 0), 0),
  };
}
