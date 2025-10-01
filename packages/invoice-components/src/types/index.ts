export interface Invoice {
  id: string;
  number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partially_paid';
  date: string;
  dueDate: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate?: number;
  discount: number;
  discountType?: 'percentage' | 'fixed';
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  paymentTerms?: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  template?: string;
  publicId?: string;
}

export interface InvoicePreviewProps {
  invoice: Invoice;
  template?: 'default' | 'minimal' | 'modern' | 'classic';
  showActions?: boolean;
  onEdit?: () => void;
  className?: string;
}

export interface InvoiceActionsProps {
  invoice: Invoice;
  onPreview?: () => void;
  onDownloadPDF?: () => void;
  onShare?: () => void;
  onSend?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  className?: string;
}

export interface ShareOptions {
  expiresIn?: '24h' | '7d' | '30d' | 'never';
  password?: string;
  allowDownload?: boolean;
  requireEmail?: boolean;
}

// Re-export item search types
export type {
  ItemType,
  BaseItem,
  ItemWithMetadata,
  ItemGroup,
  ItemSearchConfig,
  ItemSearchProps,
} from './item-search';
export { defaultItemSearchConfig } from './item-search';