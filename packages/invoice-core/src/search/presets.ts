import type { SearchProviderConfig } from './types';
import { JobSearchProvider } from './providers/job-search-provider';
import { CatalogSearchProvider } from './providers/catalog-search-provider';
import { ServiceSearchProvider } from './providers/service-search-provider';

/**
 * Pre-configured search setups for different business types
 */

export interface BusinessPresetConfig {
  type: 'construction' | 'retail' | 'services' | 'freelance' | 'custom';
  searchProviders: SearchProviderConfig;
  lineItemDefaults?: {
    includeUnits?: boolean;
    includeDecimals?: boolean;
    defaultUnit?: string;
  };
  customFields?: string[];
}

/**
 * Construction/Dirt Moving Business
 * - Job-based billing
 * - Material tracking
 * - Weighbridge data
 */
export function getConstructionPreset(
  jobSearchFn: any
): BusinessPresetConfig {
  return {
    type: 'construction',
    searchProviders: {
      providers: [
        new JobSearchProvider(jobSearchFn),
      ],
      defaultProvider: 'jobs',
      searchDebounceMs: 300,
    },
    lineItemDefaults: {
      includeUnits: true,
      includeDecimals: true,
      defaultUnit: 'm³',
    },
    customFields: [
      'ticketNumber',
      'truckRego',
      'materialType',
      'siteFrom',
      'siteTo',
      'grossWeight',
      'tareWeight',
      'netTonnage',
      'epaLevyRate',
      'epaLevyAmount',
    ],
  };
}

/**
 * Retail/E-commerce Business
 * - Product catalog
 * - SKU tracking
 * - Inventory management
 */
export function getRetailPreset(
  catalogSearchFn: any
): BusinessPresetConfig {
  return {
    type: 'retail',
    searchProviders: {
      providers: [
        new CatalogSearchProvider(catalogSearchFn),
      ],
      defaultProvider: 'catalog',
      searchDebounceMs: 200,
    },
    lineItemDefaults: {
      includeUnits: true,
      includeDecimals: true,
    },
    customFields: [
      'sku',
      'barcode',
      'category',
      'manufacturer',
      'weight',
      'dimensions',
    ],
  };
}

/**
 * Service-Based Business
 * - Time tracking
 * - Project-based billing
 * - Rate cards
 */
export function getServicePreset(
  serviceSearchFn: any,
  jobSearchFn?: any
): BusinessPresetConfig {
  const providers = [
    new ServiceSearchProvider(serviceSearchFn),
  ];
  
  if (jobSearchFn) {
    providers.push(new JobSearchProvider(jobSearchFn));
  }
  
  return {
    type: 'services',
    searchProviders: {
      providers,
      defaultProvider: 'services',
      enableMultiSearch: true,
      searchDebounceMs: 300,
    },
    lineItemDefaults: {
      includeUnits: true,
      includeDecimals: true,
      defaultUnit: 'hours',
    },
    customFields: [
      'projectId',
      'taskId',
      'billableHours',
      'nonBillableHours',
      'skillLevel',
      'department',
    ],
  };
}

/**
 * Freelance/Consultant
 * - Mixed services and products
 * - Simple time tracking
 * - Milestone billing
 */
export function getFreelancePreset(
  serviceSearchFn: any,
  catalogSearchFn?: any
): BusinessPresetConfig {
  const providers = [
    new ServiceSearchProvider(serviceSearchFn),
  ];
  
  if (catalogSearchFn) {
    providers.push(new CatalogSearchProvider(catalogSearchFn));
  }
  
  return {
    type: 'freelance',
    searchProviders: {
      providers,
      defaultProvider: 'services',
      enableMultiSearch: true,
      searchDebounceMs: 300,
    },
    lineItemDefaults: {
      includeUnits: true,
      includeDecimals: true,
    },
    customFields: [
      'milestone',
      'deliverable',
      'startDate',
      'endDate',
      'revision',
    ],
  };
}

/**
 * Hybrid Business Model
 * - All search providers
 * - Maximum flexibility
 */
export function getHybridPreset(
  searchFunctions: {
    jobs?: any;
    catalog?: any;
    services?: any;
  }
): BusinessPresetConfig {
  const providers = [];
  
  if (searchFunctions.jobs) {
    providers.push(new JobSearchProvider(searchFunctions.jobs));
  }
  if (searchFunctions.catalog) {
    providers.push(new CatalogSearchProvider(searchFunctions.catalog));
  }
  if (searchFunctions.services) {
    providers.push(new ServiceSearchProvider(searchFunctions.services));
  }
  
  return {
    type: 'custom',
    searchProviders: {
      providers,
      defaultProvider: providers[0]?.id,
      enableMultiSearch: true,
      searchDebounceMs: 300,
    },
    lineItemDefaults: {
      includeUnits: true,
      includeDecimals: true,
    },
    customFields: [],
  };
}