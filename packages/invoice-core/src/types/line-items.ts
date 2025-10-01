export interface BaseLineItem {
  name: string;
  quantity?: number;
  price?: number;
  unit?: string;
}

export interface WeighbridgeFields {
  ticketNumber?: string;
  truckRego?: string;
  weighInTime?: string;
  weighOutTime?: string;
  grossWeight?: number;
  tareWeight?: number;
  netTonnage?: number;
  volumeM3?: number;
  materialType?: string;
  siteFrom?: string;
  siteTo?: string;
  purchaseOrder?: string;
  costCenter?: string;
  epaLevyRate?: number;
  epaLevyAmount?: number;
  attachments?: string[];
}

export interface ExtendedLineItem extends BaseLineItem, WeighbridgeFields {
  // Allow for future extensions
  [key: string]: any;
}

// Default export uses the extended version for maximum flexibility
export type LineItem = ExtendedLineItem;