export interface Item {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  stock?: number;
  unit?: string;
  sku?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CartItem extends Item {
  quantity: number;
  total: number;
}

export interface Bill {
  id: string;
  invoiceNumber?: string; // New field for display invoice number
  billNumber?: string; // Sequential bill number
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate?: number; // Tax percentage
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: number;
  isInterstate?: boolean; // For GST calculation
  // Business info properties
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessTaxId?: string;
  taxNumber?: string; // GST number
}

export type PaymentMethod = "cash" | "card" | "upi" | "bank_transfer" | "other";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string; // Required field
  date: number | string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  attachments?: string[];
  title: string; // Required field
  createdAt: number; // Required field
}