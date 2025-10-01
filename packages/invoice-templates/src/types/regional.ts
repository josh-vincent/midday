import { z } from "zod";
import type { InvoiceTemplate } from "./template";

// Regional configuration for different countries/regions
export interface RegionalConfig {
  country: string;
  region?: string;
  currency: string;
  dateFormat: "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd" | "dd.MM.yyyy";
  taxSystem: TaxSystem;
  requiredFields: string[];
  optionalFields: string[];
  compliance: ComplianceRequirement[];
  numberFormat: NumberFormat;
  addressFormat: AddressFormat;
}

export interface TaxSystem {
  type: "vat" | "gst" | "sales-tax" | "none";
  defaultRate?: number;
  name: string;
  registrationLabel?: string; // e.g., "ABN", "GST Number", "VAT ID"
  registrationPattern?: RegExp;
  includeInPrice: boolean; // Tax inclusive vs exclusive pricing
}

export interface ComplianceRequirement {
  field: string;
  label: string;
  required: boolean;
  validation?: RegExp;
  helpText?: string;
}

export interface NumberFormat {
  thousandSeparator: "," | "." | " ";
  decimalSeparator: "." | ",";
  currencySymbolPosition: "before" | "after";
  currencySymbolSpace: boolean;
}

export interface AddressFormat {
  lineOrder: string[]; // ["street", "city", "state", "postal", "country"]
  postalCodeLabel: string; // "ZIP", "Postcode", "Postal Code"
  stateLabel?: string; // "State", "Province", "Region"
  requireState: boolean;
  requirePostalCode: boolean;
}

// Pre-defined regional configurations
export const REGIONAL_CONFIGS: Record<string, RegionalConfig> = {
  AU: {
    country: "Australia",
    currency: "AUD",
    dateFormat: "dd/MM/yyyy",
    taxSystem: {
      type: "gst",
      defaultRate: 10,
      name: "GST",
      registrationLabel: "ABN",
      registrationPattern: /^\d{11}$/,
      includeInPrice: true,
    },
    requiredFields: ["abn"],
    optionalFields: ["acn"],
    compliance: [
      {
        field: "abn",
        label: "ABN",
        required: true,
        validation: /^\d{11}$/,
        helpText: "11-digit Australian Business Number",
      },
      {
        field: "acn",
        label: "ACN",
        required: false,
        validation: /^\d{9}$/,
        helpText: "9-digit Australian Company Number",
      },
    ],
    numberFormat: {
      thousandSeparator: ",",
      decimalSeparator: ".",
      currencySymbolPosition: "before",
      currencySymbolSpace: false,
    },
    addressFormat: {
      lineOrder: ["street", "suburb", "state", "postcode", "country"],
      postalCodeLabel: "Postcode",
      stateLabel: "State",
      requireState: true,
      requirePostalCode: true,
    },
  },
  US: {
    country: "United States",
    currency: "USD",
    dateFormat: "MM/dd/yyyy",
    taxSystem: {
      type: "sales-tax",
      defaultRate: 0, // Varies by state
      name: "Sales Tax",
      registrationLabel: "EIN",
      registrationPattern: /^\d{2}-\d{7}$/,
      includeInPrice: false,
    },
    requiredFields: [],
    optionalFields: ["ein"],
    compliance: [
      {
        field: "ein",
        label: "EIN",
        required: false,
        validation: /^\d{2}-\d{7}$/,
        helpText: "Employer Identification Number",
      },
    ],
    numberFormat: {
      thousandSeparator: ",",
      decimalSeparator: ".",
      currencySymbolPosition: "before",
      currencySymbolSpace: false,
    },
    addressFormat: {
      lineOrder: ["street", "city", "state", "zip", "country"],
      postalCodeLabel: "ZIP",
      stateLabel: "State",
      requireState: true,
      requirePostalCode: true,
    },
  },
  GB: {
    country: "United Kingdom",
    currency: "GBP",
    dateFormat: "dd/MM/yyyy",
    taxSystem: {
      type: "vat",
      defaultRate: 20,
      name: "VAT",
      registrationLabel: "VAT Number",
      registrationPattern: /^GB\d{9}$/,
      includeInPrice: false,
    },
    requiredFields: [],
    optionalFields: ["vat"],
    compliance: [
      {
        field: "vat",
        label: "VAT Number",
        required: false,
        validation: /^GB\d{9}$/,
        helpText: "VAT registration number",
      },
    ],
    numberFormat: {
      thousandSeparator: ",",
      decimalSeparator: ".",
      currencySymbolPosition: "before",
      currencySymbolSpace: false,
    },
    addressFormat: {
      lineOrder: ["street", "city", "county", "postcode", "country"],
      postalCodeLabel: "Postcode",
      stateLabel: "County",
      requireState: false,
      requirePostalCode: true,
    },
  },
  EU: {
    country: "European Union",
    currency: "EUR",
    dateFormat: "dd.MM.yyyy",
    taxSystem: {
      type: "vat",
      defaultRate: 19, // Varies by country
      name: "VAT",
      registrationLabel: "VAT ID",
      includeInPrice: false,
    },
    requiredFields: [],
    optionalFields: ["vat"],
    compliance: [
      {
        field: "vat",
        label: "VAT ID",
        required: false,
        helpText: "VAT identification number",
      },
    ],
    numberFormat: {
      thousandSeparator: ".",
      decimalSeparator: ",",
      currencySymbolPosition: "after",
      currencySymbolSpace: true,
    },
    addressFormat: {
      lineOrder: ["street", "postal", "city", "country"],
      postalCodeLabel: "Postal Code",
      requireState: false,
      requirePostalCode: true,
    },
  },
  CA: {
    country: "Canada",
    currency: "CAD",
    dateFormat: "yyyy-MM-dd",
    taxSystem: {
      type: "gst",
      defaultRate: 5, // Plus provincial tax
      name: "GST/HST",
      registrationLabel: "GST/HST Number",
      includeInPrice: false,
    },
    requiredFields: [],
    optionalFields: ["gst"],
    compliance: [
      {
        field: "gst",
        label: "GST/HST Number",
        required: false,
        helpText: "GST/HST registration number",
      },
    ],
    numberFormat: {
      thousandSeparator: ",",
      decimalSeparator: ".",
      currencySymbolPosition: "before",
      currencySymbolSpace: false,
    },
    addressFormat: {
      lineOrder: ["street", "city", "province", "postal", "country"],
      postalCodeLabel: "Postal Code",
      stateLabel: "Province",
      requireState: true,
      requirePostalCode: true,
    },
  },
};

// Helper function to get regional config
export function getRegionalConfig(countryCode: string): RegionalConfig | undefined {
  return REGIONAL_CONFIGS[countryCode];
}

// Helper function to apply regional config to template
export function applyRegionalConfig(
  template: Partial<InvoiceTemplate>,
  countryCode: string
): Partial<InvoiceTemplate> {
  const config = getRegionalConfig(countryCode);
  if (!config) return template;
  
  return {
    ...template,
    currency: config.currency,
    dateFormat: config.dateFormat,
    locale: `${countryCode.toLowerCase()}-${countryCode}`,
    includeVat: config.taxSystem.type === "vat",
    includeTax: config.taxSystem.type === "sales-tax",
    vatRate: config.taxSystem.type === "vat" ? config.taxSystem.defaultRate : undefined,
    taxRate: config.taxSystem.type === "sales-tax" ? config.taxSystem.defaultRate : undefined,
    vatLabel: config.taxSystem.type === "vat" ? config.taxSystem.name : "VAT",
    taxLabel: config.taxSystem.type === "sales-tax" ? config.taxSystem.name : "Tax",
  };
}