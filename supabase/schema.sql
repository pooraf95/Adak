-- ============================================================
-- اسکیما و دیتابیس سوپابیس برای بوتیک لباس مردانه «آداک اورجینال»
-- ============================================================

-- ۱. فعال‌سازی اکستنشن UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ۲. جدول دسته‌بندی‌ها (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ۳. جدول محصولات و انبارداری (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    purchase_price BIGINT NOT NULL DEFAULT 0, -- قیمت خرید به تومان برای محاسبه دقیق سود
    selling_price BIGINT NOT NULL DEFAULT 0,  -- قیمت فروش به تومان
    barcode TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ۴. جدول مشتریان (Customers)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    total_debt BIGINT NOT NULL DEFAULT 0, -- مانده کل بدهی فعلی به تومان
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ۵. جدول فاکتورهای فروش (Invoices)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number BIGSERIAL UNIQUE, -- شماره فاکتور ترتیبی خوانا برای مغازه‌دار
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL DEFAULT 'مشتری گذری',
    total_amount BIGINT NOT NULL DEFAULT 0,       -- جمع کل قبل تخفیف
    discount_amount BIGINT NOT NULL DEFAULT 0,    -- تخفیف ریالی/تومانی
    final_amount BIGINT NOT NULL DEFAULT 0,       -- مبلغ نهایی قابل پرداخت (جمع کل منهای تخفیف)
    paid_amount BIGINT NOT NULL DEFAULT 0,        -- مبلغ واریز شده نقدی/کارتخوان در لحظه
    debt_amount BIGINT NOT NULL DEFAULT 0,        -- مبلغ باقیمانده به عنوان نسیه/بدهی
    payment_status TEXT NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'partial', 'credit')),
    -- 'paid': تسویه کامل, 'partial': تسویه ناقص, 'credit': نسیه کامل
    total_purchase_cost BIGINT NOT NULL DEFAULT 0, -- مجموع هزینه خرید اقلام برای محاسبه سود
    net_profit BIGINT NOT NULL DEFAULT 0,          -- سود خالص فاکتور (مبلغ نهایی منهای هزینه خرید)
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ۶. جدول اقلام فاکتور (Invoice Items)
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price BIGINT NOT NULL,          -- قیمت واحد فروش زمان صدور
    unit_purchase_price BIGINT NOT NULL, -- قیمت واحد خرید زمان صدور
    total_price BIGINT NOT NULL,         -- quantity * unit_price
    total_purchase_cost BIGINT NOT NULL, -- quantity * unit_purchase_price
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ۷. جدول دریافت بدهی و تسویه نسیه (Customer Payments)
CREATE TABLE IF NOT EXISTS public.customer_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    amount BIGINT NOT NULL CHECK (amount > 0), -- مبلغ پرداختی بابت تسویه بدهی به تومان
    payment_method TEXT DEFAULT 'کارتخوان',    -- کارتخوان، نقد، کارت به کارت
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================
-- تریگرها و توابع خودکار دیتابیس (Business Logic Automations)
-- ============================================================

-- الف) کسر خودکار از موجودی انبار پس از ثبت فاکتور
CREATE OR REPLACE FUNCTION public.decrease_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
        updated_at = NOW()
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_decrease_product_stock ON public.invoice_items;
CREATE TRIGGER tr_decrease_product_stock
AFTER INSERT ON public.invoice_items
FOR EACH ROW
WHEN (NEW.product_id IS NOT NULL)
EXECUTE FUNCTION public.decrease_product_stock();

-- ب) برگشت به موجودی انبار در صورت حذف قلم فاکتور
CREATE OR REPLACE FUNCTION public.restore_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock_quantity = stock_quantity + OLD.quantity,
        updated_at = NOW()
    WHERE id = OLD.product_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_restore_product_stock ON public.invoice_items;
CREATE TRIGGER tr_restore_product_stock
AFTER DELETE ON public.invoice_items
FOR EACH ROW
WHEN (OLD.product_id IS NOT NULL)
EXECUTE FUNCTION public.restore_product_stock();

-- ج) به‌روزرسانی بدهی مشتری پس از ثبت فاکتور نسیه یا پرداخت ناقص
CREATE OR REPLACE FUNCTION public.update_customer_debt_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL AND NEW.debt_amount > 0 THEN
        UPDATE public.customers
        SET total_debt = total_debt + NEW.debt_amount,
            updated_at = NOW()
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_customer_debt_on_invoice ON public.invoices;
CREATE TRIGGER tr_update_customer_debt_on_invoice
AFTER INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_customer_debt_on_invoice();

-- د) کسر از بدهی مشتری پس از ثبت پرداخت طلب/نسیه
CREATE OR REPLACE FUNCTION public.reduce_customer_debt_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.customers
    SET total_debt = GREATEST(0, total_debt - NEW.amount),
        updated_at = NOW()
    WHERE id = NEW.customer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_reduce_customer_debt_on_payment ON public.customer_payments;
CREATE TRIGGER tr_reduce_customer_debt_on_payment
AFTER INSERT ON public.customer_payments
FOR EACH ROW
EXECUTE FUNCTION public.reduce_customer_debt_on_payment();

-- ============================================================
-- فعال‌سازی RLS و پالیسی‌های دسترسی (Row Level Security)
-- ============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

-- پالیسی‌های دسترسی عمومی (یا با کلید ناشناس / اعتبارسنجی شده مغازه)
DROP POLICY IF EXISTS "Allow full access to categories" ON public.categories;
CREATE POLICY "Allow full access to categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to products" ON public.products;
CREATE POLICY "Allow full access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to customers" ON public.customers;
CREATE POLICY "Allow full access to customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to invoices" ON public.invoices;
CREATE POLICY "Allow full access to invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to invoice_items" ON public.invoice_items;
CREATE POLICY "Allow full access to invoice_items" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to customer_payments" ON public.customer_payments;
CREATE POLICY "Allow full access to customer_payments" ON public.customer_payments FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- داده‌های اولیه نمونه برای تست سریع بوتیک «آداک اورجینال»
-- ============================================================
INSERT INTO public.categories (name) VALUES 
('تیشرت و پلوشرت'),
('شلوار جین و کتان'),
('شلوار اسلش و کارگو'),
('پیراهن مردانه'),
('هودی و دورس'),
('کاپشن و بادگیر'),
('کتونی و ونس'),
('اکسسوری و کمربند')
ON CONFLICT (name) DO NOTHING;

-- چند نمونه محصول اولیه
INSERT INTO public.products (category_id, name, stock_quantity, purchase_price, selling_price)
SELECT id, 'تیشرت اوورسایز بیسیک مشکی', 25, 280000, 480000 
FROM public.categories WHERE name = 'تیشرت و پلوشرت' LIMIT 1;

INSERT INTO public.products (category_id, name, stock_quantity, purchase_price, selling_price)
SELECT id, 'شلوار جین مام استایل زغالی', 14, 520000, 890000 
FROM public.categories WHERE name = 'شلوار جین و کتان' LIMIT 1;

INSERT INTO public.products (category_id, name, stock_quantity, purchase_price, selling_price)
SELECT id, 'بادگیر دورو ضدآب کلاه‌دار', 8, 750000, 1350000 
FROM public.categories WHERE name = 'کاپشن و بادگیر' LIMIT 1;

INSERT INTO public.products (category_id, name, stock_quantity, purchase_price, selling_price)
SELECT id, 'کتونی نیوبالانس ۵۵۰ سفید سبز', 6, 850000, 1580000 
FROM public.categories WHERE name = 'کتونی و ونس' LIMIT 1;

-- دو نمونه مشتری اولیه با وضعیت بدهی
INSERT INTO public.customers (name, phone, total_debt, notes) VALUES
('علی رضایی', '09121112233', 450000, 'مشتری ثابت، خوش حساب'),
('محمدرضا کاظمی', '09358889900', 0, 'خریدار تیشرت‌های اوورسایز');
