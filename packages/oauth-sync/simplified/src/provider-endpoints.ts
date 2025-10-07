/**
 * Provider Endpoint Registry
 *
 * Auto-detect API endpoints based on provider and entity type.
 */

export type SyncEntity =
  | 'customers'
  | 'invoices'
  | 'transactions'
  | 'accounts'
  | 'items'
  | 'bills'
  | 'payments'
  | 'vendors'
  | 'employees';

export interface ProviderEndpoint {
  url: string;
  method?: 'GET' | 'POST';
  responseKey?: string; // Key in response that contains the array of data
  headers?: Record<string, string>;
}

/**
 * Provider-specific endpoint configurations
 */
export const PROVIDER_ENDPOINTS: Record<
  string, // provider name
  Record<SyncEntity, ProviderEndpoint>
> = {
  xero: {
    customers: {
      url: 'https://api.xero.com/api.xro/2.0/Contacts',
      responseKey: 'Contacts',
    },
    invoices: {
      url: 'https://api.xero.com/api.xro/2.0/Invoices',
      responseKey: 'Invoices',
    },
    transactions: {
      url: 'https://api.xero.com/api.xro/2.0/BankTransactions',
      responseKey: 'BankTransactions',
    },
    accounts: {
      url: 'https://api.xero.com/api.xro/2.0/Accounts',
      responseKey: 'Accounts',
    },
    items: {
      url: 'https://api.xero.com/api.xro/2.0/Items',
      responseKey: 'Items',
    },
    bills: {
      url: 'https://api.xero.com/api.xro/2.0/Invoices?where=Type=="ACCPAY"',
      responseKey: 'Invoices',
    },
    payments: {
      url: 'https://api.xero.com/api.xro/2.0/Payments',
      responseKey: 'Payments',
    },
    vendors: {
      url: 'https://api.xero.com/api.xro/2.0/Contacts?where=IsSupplier==true',
      responseKey: 'Contacts',
    },
    employees: {
      url: 'https://api.xero.com/api.xro/2.0/Employees',
      responseKey: 'Employees',
    },
  },

  quickbooks: {
    customers: {
      url: 'https://quickbooks.api.intuit.com/v3/company/{realmId}/query?query=select * from Customer',
      responseKey: 'QueryResponse.Customer',
    },
    invoices: {
      url: 'https://quickbooks.api.intuit.com/v3/company/{realmId}/query?query=select * from Invoice',
      responseKey: 'QueryResponse.Invoice',
    },
    transactions: {
      url: 'https://quickbooks.api.intuit.com/v3/company/{realmId}/query?query=select * from Transaction',
      responseKey: 'QueryResponse.Transaction',
    },
    accounts: {
      url: 'https://quickbooks.api.intuit.com/v3/company/{realmId}/query?query=select * from Account',
      responseKey: 'QueryResponse.Account',
    },
    items: {
      url: 'https://quickbooks.api.intuit.com/v3/company/{realmId}/query?query=select * from Item',
      responseKey: 'QueryResponse.Item',
    },
    bills: {
      url: 'https://quickbooks.api.intuit.com/v3/company/{realmId}/query?query=select * from Bill',
      responseKey: 'QueryResponse.Bill',
    },
    payments: {
      url: 'https://quickbooks.api.intuit.com/v3/company/{realmId}/query?query=select * from Payment',
      responseKey: 'QueryResponse.Payment',
    },
    vendors: {
      url: 'https://quickbooks.api.intuit.com/v3/company/{realmId}/query?query=select * from Vendor',
      responseKey: 'QueryResponse.Vendor',
    },
    employees: {
      url: 'https://quickbooks.api.intuit.com/v3/company/{realmId}/query?query=select * from Employee',
      responseKey: 'QueryResponse.Employee',
    },
  },

  outlook: {
    customers: {
      url: 'https://graph.microsoft.com/v1.0/me/contacts',
      responseKey: 'value',
    },
    invoices: {
      url: 'https://graph.microsoft.com/v1.0/me/messages?$filter=subject contains "invoice"',
      responseKey: 'value',
    },
    transactions: {
      url: 'https://graph.microsoft.com/v1.0/me/messages',
      responseKey: 'value',
    },
    accounts: {
      url: 'https://graph.microsoft.com/v1.0/me/mailFolders',
      responseKey: 'value',
    },
    items: {
      url: 'https://graph.microsoft.com/v1.0/me/contacts',
      responseKey: 'value',
    },
    bills: {
      url: 'https://graph.microsoft.com/v1.0/me/messages?$filter=subject contains "bill"',
      responseKey: 'value',
    },
    payments: {
      url: 'https://graph.microsoft.com/v1.0/me/messages?$filter=subject contains "payment"',
      responseKey: 'value',
    },
    vendors: {
      url: 'https://graph.microsoft.com/v1.0/me/contacts',
      responseKey: 'value',
    },
    employees: {
      url: 'https://graph.microsoft.com/v1.0/users',
      responseKey: 'value',
    },
  },

  gmail: {
    customers: {
      url: 'https://people.googleapis.com/v1/people/me/connections',
      responseKey: 'connections',
    },
    invoices: {
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=subject:invoice',
      responseKey: 'messages',
    },
    transactions: {
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
      responseKey: 'messages',
    },
    accounts: {
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
      responseKey: 'labels',
    },
    items: {
      url: 'https://people.googleapis.com/v1/people/me/connections',
      responseKey: 'connections',
    },
    bills: {
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=subject:bill',
      responseKey: 'messages',
    },
    payments: {
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=subject:payment',
      responseKey: 'messages',
    },
    vendors: {
      url: 'https://people.googleapis.com/v1/people/me/connections',
      responseKey: 'connections',
    },
    employees: {
      url: 'https://people.googleapis.com/v1/people/me/connections',
      responseKey: 'connections',
    },
  },
};

/**
 * Get endpoint configuration for a provider and entity
 */
export function getProviderEndpoint(
  provider: string,
  entity: SyncEntity
): ProviderEndpoint | null {
  const providerEndpoints = PROVIDER_ENDPOINTS[provider];
  if (!providerEndpoints) {
    return null;
  }

  return providerEndpoints[entity] || null;
}

/**
 * Replace variables in URL (like {realmId})
 */
export function interpolateUrl(
  url: string,
  variables: Record<string, string>
): string {
  let result = url;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}

/**
 * Extract data from API response using response key
 */
export function extractDataFromResponse(
  response: any,
  responseKey?: string
): any[] {
  if (!responseKey) {
    // If no response key, assume response is the array
    return Array.isArray(response) ? response : [response];
  }

  // Support nested keys like "QueryResponse.Customer"
  const keys = responseKey.split('.');
  let data = response;

  for (const key of keys) {
    data = data?.[key];
    if (data === undefined || data === null) {
      return [];
    }
  }

  return Array.isArray(data) ? data : [data];
}
