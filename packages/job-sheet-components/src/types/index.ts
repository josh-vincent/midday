export interface JobSheetProps {
  jobId?: string | null;
  createJob?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trpcClient: any; // Will be typed by the consuming app
}

export interface JobViewSheetProps extends JobSheetProps {
  showCustomerSection?: boolean;
  showLocationSection?: boolean;
  showInvoiceSection?: boolean;
  showQuoteSection?: boolean;
  showTimelineSection?: boolean;
  showAssetsSection?: boolean;
  showDebugSection?: boolean;
}

export interface JobData {
  id?: string;
  title?: string;
  jobNumber?: string;
  companyName?: string;
  description?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'delivered' | 'on_hold' | 'pending';
  priority?: 'emergency' | 'urgent' | 'high' | 'medium' | 'low';
  type?: string;

  // Customer info (all optional)
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customer?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
  } | null;

  // Location info (all optional)
  locationId?: string | null;
  locationName?: string | null;
  locationAddress?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  locationZip?: string | null;

  // Contact details
  contactPerson?: string | null;
  contactNumber?: string | null;

  // Scheduling (all optional)
  scheduledDate?: string | null;
  jobDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  estimatedDuration?: string | null;
  arrivalTime?: string | null;
  completedTime?: string | null;

  // Invoice/Quote (all optional)
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceAmount?: number | null;
  invoiceStatus?: string | null;
  invoiceDate?: string | null;
  quoteId?: string | null;
  quoteNumber?: string | null;
  quoteAmount?: number | null;
  quoteStatus?: string | null;
  quoteDate?: string | null;

  // Assets (optional)
  assets?: any[];

  // Timeline (optional)
  timeline?: TimelineEvent[];

  // Job-specific fields (all optional)
  rego?: string | null;
  materialType?: string | null;
  equipmentType?: string | null;
  addressSite?: string | null;
  sourceLocation?: string | null;
  sourceAddress?: string | null;
  destinationSite?: string | null;
  volume?: number | null;
  weight?: number | null;
  weightKg?: number | null;
  pricePerUnit?: number | null;
  pricePerCubicMeter?: number | null;
  cubicMetreCapacity?: number | null;
  quantityCubicMeters?: number | null;
  loadNumber?: number | null;
  totalAmount?: number | null;
  dirtType?: string | null;

  // Metadata (optional)
  teamId?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface SectionProps {
  data?: JobData;
  isLoading?: boolean;
}

export interface CustomerSectionProps extends SectionProps {
  customerId?: string;
}

export interface LocationSectionProps extends SectionProps {
  locationId?: string;
}

export interface InvoiceSectionProps extends SectionProps {
  invoiceId?: string;
}

export interface QuoteSectionProps extends SectionProps {
  quoteId?: string;
}

export interface TimelineSectionProps extends SectionProps {
  events?: TimelineEvent[];
}
