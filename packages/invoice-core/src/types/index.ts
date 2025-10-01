import type { 
  EditorDoc, 
  EditorNode, 
  InvoiceStatus,
  Customer,
  Team,
  Template
} from './base';

import type {
  BaseLineItem,
  WeighbridgeFields,
  ExtendedLineItem,
  LineItem
} from './line-items';

export type { 
  EditorDoc, 
  EditorNode, 
  InvoiceStatus,
  Customer,
  Team,
  Template
} from './base';

export type {
  BaseLineItem,
  WeighbridgeFields,
  ExtendedLineItem,
  LineItem
} from './line-items';

export interface Invoice {
  id: string;
  dueDate: string | null;
  invoiceNumber: string | null;
  createdAt: string;
  amount: number | null;
  currency: string | null;
  lineItems: LineItem[];
  paymentDetails: EditorDoc | null;
  customerDetails: EditorDoc | null;
  reminderSentAt: string | null;
  updatedAt: string | null;
  note: string | null;
  internalNote: string | null;
  paidAt: string | null;
  vat: number | null;
  tax: number | null;
  filePath: string[] | null;
  status: InvoiceStatus;
  viewedAt: string | null;
  fromDetails: EditorDoc | null;
  issueDate: string | null;
  sentAt: string | null;
  template: Template;
  noteDetails: EditorDoc | null;
  customerName: string | null;
  token: string;
  sentTo: string | null;
  discount: number | null;
  subtotal: number | null;
  topBlock: EditorDoc | null;
  bottomBlock: EditorDoc | null;
  customer: Customer | null;
  customerId: string | null;
  team: Team | null;
}