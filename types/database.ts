export type PaymentStatus = 'paid' | 'partial' | 'credit';

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  stock_quantity: number;
  purchase_price: number;
  selling_price: number;
  barcode?: string | null;
  created_at: string;
  updated_at: string;
  // Joined field:
  category?: Category | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  total_debt: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_purchase_price: number;
  total_price: number;
  total_purchase_cost: number;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: number;
  customer_id: string | null;
  customer_name: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  paid_amount: number;
  debt_amount: number;
  payment_status: PaymentStatus;
  total_purchase_cost: number;
  net_profit: number;
  notes?: string | null;
  created_at: string;
  customer?: Customer | null;
  items?: InvoiceItem[];
}

export interface CustomerPayment {
  id: string;
  customer_id: string;
  invoice_id?: string | null;
  amount: number;
  payment_method: string;
  notes?: string | null;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  unit_purchase_price: number;
}
