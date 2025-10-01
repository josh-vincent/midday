export interface InvoiceCustomer {
  name: string;
  email: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  customer: InvoiceCustomer;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountDue: number;
  currency: string;
  viewedAt?: string | null;
  paidAt?: string | null;
  sentAt?: string | null;
  notes?: string;
}