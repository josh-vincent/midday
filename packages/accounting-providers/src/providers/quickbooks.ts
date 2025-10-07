import QuickBooks from "node-quickbooks";
import { logger } from "@midday/logger";
import type {
  IAccountingProvider,
  QuickBooksCredentials,
  AccountingCustomer,
  AccountingInvoice,
  AccountingPayment,
  AccountingAccount,
  AccountingItem,
  AccountingVendor,
  AccountingBill,
  InvoiceLineItem,
} from "../types";

export class QuickBooksProvider implements IAccountingProvider {
  private qbo: any;
  private credentials: QuickBooksCredentials;

  constructor(credentials: QuickBooksCredentials) {
    this.credentials = credentials;
    this.initializeClient();
  }

  private initializeClient(): void {
    const useSandbox = this.credentials.environment === "sandbox";

    this.qbo = new QuickBooks(
      this.credentials.clientId,
      this.credentials.clientSecret,
      this.credentials.accessToken || "",
      false, // no token secret for OAuth 2.0
      this.credentials.realmId,
      useSandbox,
      true, // debug
      null, // minor version
      "2.0", // oauth version
      this.credentials.refreshToken || ""
    );
  }

  async getAuthUrl(redirectUri: string, state?: string): Promise<string> {
    return this.qbo.authorizeUrl(redirectUri, state);
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.qbo.getToken(code, (error: any, token: any) => {
        if (error) {
          logger.error("QuickBooks token exchange failed", { error });
          reject(error);
        } else {
          this.credentials.accessToken = token.access_token;
          this.credentials.refreshToken = token.refresh_token;
          this.credentials.expiryDate = Date.now() + token.expires_in * 1000;
          this.initializeClient();
          resolve(token);
        }
      });
    });
  }

  async refreshAccessToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.qbo.refreshAccessToken((error: any, token: any) => {
        if (error) {
          logger.error("QuickBooks token refresh failed", { error });
          reject(error);
        } else {
          this.credentials.accessToken = token.access_token;
          this.credentials.refreshToken = token.refresh_token;
          this.credentials.expiryDate = Date.now() + token.expires_in * 1000;
          this.initializeClient();
          resolve();
        }
      });
    });
  }

  getCredentials(): QuickBooksCredentials {
    return { ...this.credentials };
  }

  // Customers
  async getCustomers(options?: { modifiedSince?: Date; maxResults?: number }): Promise<AccountingCustomer[]> {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM Customer";

      if (options?.modifiedSince) {
        const dateStr = options.modifiedSince.toISOString().split('T')[0];
        query += ` WHERE Metadata.LastUpdatedTime > '${dateStr}'`;
      }

      if (options?.maxResults) {
        query += ` MAXRESULTS ${options.maxResults}`;
      }

      this.qbo.findCustomers(query, (error: any, customers: any) => {
        if (error) {
          logger.error("QuickBooks getCustomers failed", { error });
          reject(error);
        } else {
          const mappedCustomers = (customers?.QueryResponse?.Customer || []).map(this.mapQBCustomer);
          resolve(mappedCustomers);
        }
      });
    });
  }

  async getCustomer(id: string): Promise<AccountingCustomer | null> {
    return new Promise((resolve, reject) => {
      this.qbo.getCustomer(id, (error: any, customer: any) => {
        if (error) {
          logger.error("QuickBooks getCustomer failed", { error, id });
          reject(error);
        } else {
          resolve(customer ? this.mapQBCustomer(customer) : null);
        }
      });
    });
  }

  async createCustomer(customer: AccountingCustomer): Promise<AccountingCustomer> {
    return new Promise((resolve, reject) => {
      const qbCustomer = this.mapToQBCustomer(customer);

      this.qbo.createCustomer(qbCustomer, (error: any, created: any) => {
        if (error) {
          logger.error("QuickBooks createCustomer failed", { error, customer });
          reject(error);
        } else {
          resolve(this.mapQBCustomer(created));
        }
      });
    });
  }

  async updateCustomer(id: string, customer: Partial<AccountingCustomer>): Promise<AccountingCustomer> {
    return new Promise(async (resolve, reject) => {
      try {
        const existing = await this.getCustomer(id);
        if (!existing) {
          throw new Error(`Customer ${id} not found`);
        }

        const updated = { ...existing, ...customer };
        const qbCustomer = this.mapToQBCustomer(updated);
        qbCustomer.Id = id;

        this.qbo.updateCustomer(qbCustomer, (error: any, result: any) => {
          if (error) {
            logger.error("QuickBooks updateCustomer failed", { error, id });
            reject(error);
          } else {
            resolve(this.mapQBCustomer(result));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteCustomer(id: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const customer = await this.getCustomer(id);
        if (!customer) {
          throw new Error(`Customer ${id} not found`);
        }

        this.qbo.deleteCustomer(id, (error: any) => {
          if (error) {
            logger.error("QuickBooks deleteCustomer failed", { error, id });
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Invoices
  async getInvoices(options?: { modifiedSince?: Date; status?: string; maxResults?: number }): Promise<AccountingInvoice[]> {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM Invoice";
      const conditions: string[] = [];

      if (options?.modifiedSince) {
        const dateStr = options.modifiedSince.toISOString().split('T')[0];
        conditions.push(`Metadata.LastUpdatedTime > '${dateStr}'`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (options?.maxResults) {
        query += ` MAXRESULTS ${options.maxResults}`;
      }

      this.qbo.findInvoices(query, (error: any, invoices: any) => {
        if (error) {
          logger.error("QuickBooks getInvoices failed", { error });
          reject(error);
        } else {
          const mappedInvoices = (invoices?.QueryResponse?.Invoice || []).map(this.mapQBInvoice.bind(this));
          resolve(mappedInvoices);
        }
      });
    });
  }

  async getInvoice(id: string): Promise<AccountingInvoice | null> {
    return new Promise((resolve, reject) => {
      this.qbo.getInvoice(id, (error: any, invoice: any) => {
        if (error) {
          logger.error("QuickBooks getInvoice failed", { error, id });
          reject(error);
        } else {
          resolve(invoice ? this.mapQBInvoice(invoice) : null);
        }
      });
    });
  }

  async createInvoice(invoice: AccountingInvoice): Promise<AccountingInvoice> {
    return new Promise((resolve, reject) => {
      const qbInvoice = this.mapToQBInvoice(invoice);

      this.qbo.createInvoice(qbInvoice, (error: any, created: any) => {
        if (error) {
          logger.error("QuickBooks createInvoice failed", { error, invoice });
          reject(error);
        } else {
          resolve(this.mapQBInvoice(created));
        }
      });
    });
  }

  async updateInvoice(id: string, invoice: Partial<AccountingInvoice>): Promise<AccountingInvoice> {
    return new Promise(async (resolve, reject) => {
      try {
        const existing = await this.getInvoice(id);
        if (!existing) {
          throw new Error(`Invoice ${id} not found`);
        }

        const updated = { ...existing, ...invoice };
        const qbInvoice = this.mapToQBInvoice(updated);
        qbInvoice.Id = id;

        this.qbo.updateInvoice(qbInvoice, (error: any, result: any) => {
          if (error) {
            logger.error("QuickBooks updateInvoice failed", { error, id });
            reject(error);
          } else {
            resolve(this.mapQBInvoice(result));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async deleteInvoice(id: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const invoice = await this.getInvoice(id);
        if (!invoice) {
          throw new Error(`Invoice ${id} not found`);
        }

        this.qbo.deleteInvoice(id, (error: any) => {
          if (error) {
            logger.error("QuickBooks deleteInvoice failed", { error, id });
            reject(error);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async sendInvoice(id: string, email?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.qbo.sendInvoicePdf(id, email, (error: any) => {
        if (error) {
          logger.error("QuickBooks sendInvoice failed", { error, id });
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // Payments
  async getPayments(options?: { modifiedSince?: Date; maxResults?: number }): Promise<AccountingPayment[]> {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM Payment";

      if (options?.modifiedSince) {
        const dateStr = options.modifiedSince.toISOString().split('T')[0];
        query += ` WHERE Metadata.LastUpdatedTime > '${dateStr}'`;
      }

      if (options?.maxResults) {
        query += ` MAXRESULTS ${options.maxResults}`;
      }

      this.qbo.findPayments(query, (error: any, payments: any) => {
        if (error) {
          logger.error("QuickBooks getPayments failed", { error });
          reject(error);
        } else {
          const mappedPayments = (payments?.QueryResponse?.Payment || []).map(this.mapQBPayment);
          resolve(mappedPayments);
        }
      });
    });
  }

  async getPayment(id: string): Promise<AccountingPayment | null> {
    return new Promise((resolve, reject) => {
      this.qbo.getPayment(id, (error: any, payment: any) => {
        if (error) {
          logger.error("QuickBooks getPayment failed", { error, id });
          reject(error);
        } else {
          resolve(payment ? this.mapQBPayment(payment) : null);
        }
      });
    });
  }

  async createPayment(payment: AccountingPayment): Promise<AccountingPayment> {
    return new Promise((resolve, reject) => {
      const qbPayment = this.mapToQBPayment(payment);

      this.qbo.createPayment(qbPayment, (error: any, created: any) => {
        if (error) {
          logger.error("QuickBooks createPayment failed", { error, payment });
          reject(error);
        } else {
          resolve(this.mapQBPayment(created));
        }
      });
    });
  }

  // Accounts
  async getAccounts(): Promise<AccountingAccount[]> {
    return new Promise((resolve, reject) => {
      this.qbo.findAccounts((error: any, accounts: any) => {
        if (error) {
          logger.error("QuickBooks getAccounts failed", { error });
          reject(error);
        } else {
          const mappedAccounts = (accounts?.QueryResponse?.Account || []).map(this.mapQBAccount);
          resolve(mappedAccounts);
        }
      });
    });
  }

  async getAccount(id: string): Promise<AccountingAccount | null> {
    return new Promise((resolve, reject) => {
      this.qbo.getAccount(id, (error: any, account: any) => {
        if (error) {
          logger.error("QuickBooks getAccount failed", { error, id });
          reject(error);
        } else {
          resolve(account ? this.mapQBAccount(account) : null);
        }
      });
    });
  }

  // Items
  async getItems(options?: { isActive?: boolean; maxResults?: number }): Promise<AccountingItem[]> {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM Item";

      if (options?.isActive !== undefined) {
        query += ` WHERE Active = ${options.isActive}`;
      }

      if (options?.maxResults) {
        query += ` MAXRESULTS ${options.maxResults}`;
      }

      this.qbo.findItems(query, (error: any, items: any) => {
        if (error) {
          logger.error("QuickBooks getItems failed", { error });
          reject(error);
        } else {
          const mappedItems = (items?.QueryResponse?.Item || []).map(this.mapQBItem);
          resolve(mappedItems);
        }
      });
    });
  }

  async getItem(id: string): Promise<AccountingItem | null> {
    return new Promise((resolve, reject) => {
      this.qbo.getItem(id, (error: any, item: any) => {
        if (error) {
          logger.error("QuickBooks getItem failed", { error, id });
          reject(error);
        } else {
          resolve(item ? this.mapQBItem(item) : null);
        }
      });
    });
  }

  async createItem(item: AccountingItem): Promise<AccountingItem> {
    return new Promise((resolve, reject) => {
      const qbItem = this.mapToQBItem(item);

      this.qbo.createItem(qbItem, (error: any, created: any) => {
        if (error) {
          logger.error("QuickBooks createItem failed", { error, item });
          reject(error);
        } else {
          resolve(this.mapQBItem(created));
        }
      });
    });
  }

  async updateItem(id: string, item: Partial<AccountingItem>): Promise<AccountingItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const existing = await this.getItem(id);
        if (!existing) {
          throw new Error(`Item ${id} not found`);
        }

        const updated = { ...existing, ...item };
        const qbItem = this.mapToQBItem(updated);
        qbItem.Id = id;

        this.qbo.updateItem(qbItem, (error: any, result: any) => {
          if (error) {
            logger.error("QuickBooks updateItem failed", { error, id });
            reject(error);
          } else {
            resolve(this.mapQBItem(result));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Vendors
  async getVendors(options?: { modifiedSince?: Date; maxResults?: number }): Promise<AccountingVendor[]> {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM Vendor";

      if (options?.modifiedSince) {
        const dateStr = options.modifiedSince.toISOString().split('T')[0];
        query += ` WHERE Metadata.LastUpdatedTime > '${dateStr}'`;
      }

      if (options?.maxResults) {
        query += ` MAXRESULTS ${options.maxResults}`;
      }

      this.qbo.findVendors(query, (error: any, vendors: any) => {
        if (error) {
          logger.error("QuickBooks getVendors failed", { error });
          reject(error);
        } else {
          const mappedVendors = (vendors?.QueryResponse?.Vendor || []).map(this.mapQBVendor);
          resolve(mappedVendors);
        }
      });
    });
  }

  async getVendor(id: string): Promise<AccountingVendor | null> {
    return new Promise((resolve, reject) => {
      this.qbo.getVendor(id, (error: any, vendor: any) => {
        if (error) {
          logger.error("QuickBooks getVendor failed", { error, id });
          reject(error);
        } else {
          resolve(vendor ? this.mapQBVendor(vendor) : null);
        }
      });
    });
  }

  async createVendor(vendor: AccountingVendor): Promise<AccountingVendor> {
    return new Promise((resolve, reject) => {
      const qbVendor = this.mapToQBVendor(vendor);

      this.qbo.createVendor(qbVendor, (error: any, created: any) => {
        if (error) {
          logger.error("QuickBooks createVendor failed", { error, vendor });
          reject(error);
        } else {
          resolve(this.mapQBVendor(created));
        }
      });
    });
  }

  async updateVendor(id: string, vendor: Partial<AccountingVendor>): Promise<AccountingVendor> {
    return new Promise(async (resolve, reject) => {
      try {
        const existing = await this.getVendor(id);
        if (!existing) {
          throw new Error(`Vendor ${id} not found`);
        }

        const updated = { ...existing, ...vendor };
        const qbVendor = this.mapToQBVendor(updated);
        qbVendor.Id = id;

        this.qbo.updateVendor(qbVendor, (error: any, result: any) => {
          if (error) {
            logger.error("QuickBooks updateVendor failed", { error, id });
            reject(error);
          } else {
            resolve(this.mapQBVendor(result));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Bills
  async getBills(options?: { modifiedSince?: Date; status?: string; maxResults?: number }): Promise<AccountingBill[]> {
    return new Promise((resolve, reject) => {
      let query = "SELECT * FROM Bill";
      const conditions: string[] = [];

      if (options?.modifiedSince) {
        const dateStr = options.modifiedSince.toISOString().split('T')[0];
        conditions.push(`Metadata.LastUpdatedTime > '${dateStr}'`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      if (options?.maxResults) {
        query += ` MAXRESULTS ${options.maxResults}`;
      }

      this.qbo.findBills(query, (error: any, bills: any) => {
        if (error) {
          logger.error("QuickBooks getBills failed", { error });
          reject(error);
        } else {
          const mappedBills = (bills?.QueryResponse?.Bill || []).map(this.mapQBBill.bind(this));
          resolve(mappedBills);
        }
      });
    });
  }

  async getBill(id: string): Promise<AccountingBill | null> {
    return new Promise((resolve, reject) => {
      this.qbo.getBill(id, (error: any, bill: any) => {
        if (error) {
          logger.error("QuickBooks getBill failed", { error, id });
          reject(error);
        } else {
          resolve(bill ? this.mapQBBill(bill) : null);
        }
      });
    });
  }

  async createBill(bill: AccountingBill): Promise<AccountingBill> {
    return new Promise((resolve, reject) => {
      const qbBill = this.mapToQBBill(bill);

      this.qbo.createBill(qbBill, (error: any, created: any) => {
        if (error) {
          logger.error("QuickBooks createBill failed", { error, bill });
          reject(error);
        } else {
          resolve(this.mapQBBill(created));
        }
      });
    });
  }

  async updateBill(id: string, bill: Partial<AccountingBill>): Promise<AccountingBill> {
    return new Promise(async (resolve, reject) => {
      try {
        const existing = await this.getBill(id);
        if (!existing) {
          throw new Error(`Bill ${id} not found`);
        }

        const updated = { ...existing, ...bill };
        const qbBill = this.mapToQBBill(updated);
        qbBill.Id = id;

        this.qbo.updateBill(qbBill, (error: any, result: any) => {
          if (error) {
            logger.error("QuickBooks updateBill failed", { error, id });
            reject(error);
          } else {
            resolve(this.mapQBBill(result));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Utility
  async getCompanyInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.qbo.getCompanyInfo(this.credentials.realmId, (error: any, info: any) => {
        if (error) {
          logger.error("QuickBooks getCompanyInfo failed", { error });
          reject(error);
        } else {
          resolve(info);
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    // Cleanup if needed
    return Promise.resolve();
  }

  // Mapping functions from QuickBooks to our format
  private mapQBCustomer(qbCustomer: any): AccountingCustomer {
    return {
      id: qbCustomer.Id,
      externalId: qbCustomer.Id,
      displayName: qbCustomer.DisplayName,
      firstName: qbCustomer.GivenName,
      lastName: qbCustomer.FamilyName,
      companyName: qbCustomer.CompanyName,
      email: qbCustomer.PrimaryEmailAddr?.Address,
      phone: qbCustomer.PrimaryPhone?.FreeFormNumber,
      website: qbCustomer.WebAddr?.URI,
      billingAddress: qbCustomer.BillAddr ? {
        line1: qbCustomer.BillAddr.Line1,
        city: qbCustomer.BillAddr.City,
        state: qbCustomer.BillAddr.CountrySubDivisionCode,
        postalCode: qbCustomer.BillAddr.PostalCode,
        country: qbCustomer.BillAddr.Country,
      } : undefined,
      balance: qbCustomer.Balance,
      currencyCode: qbCustomer.CurrencyRef?.value,
      taxNumber: qbCustomer.TaxIdentifier,
      notes: qbCustomer.Notes,
      createdAt: qbCustomer.MetaData?.CreateTime ? new Date(qbCustomer.MetaData.CreateTime) : undefined,
      updatedAt: qbCustomer.MetaData?.LastUpdatedTime ? new Date(qbCustomer.MetaData.LastUpdatedTime) : undefined,
    };
  }

  private mapToQBCustomer(customer: AccountingCustomer): any {
    return {
      DisplayName: customer.displayName,
      GivenName: customer.firstName,
      FamilyName: customer.lastName,
      CompanyName: customer.companyName,
      PrimaryEmailAddr: customer.email ? { Address: customer.email } : undefined,
      PrimaryPhone: customer.phone ? { FreeFormNumber: customer.phone } : undefined,
      WebAddr: customer.website ? { URI: customer.website } : undefined,
      BillAddr: customer.billingAddress ? {
        Line1: customer.billingAddress.line1,
        City: customer.billingAddress.city,
        CountrySubDivisionCode: customer.billingAddress.state,
        PostalCode: customer.billingAddress.postalCode,
        Country: customer.billingAddress.country,
      } : undefined,
      Notes: customer.notes,
    };
  }

  private mapQBInvoice(qbInvoice: any): AccountingInvoice {
    const lineItems: InvoiceLineItem[] = (qbInvoice.Line || [])
      .filter((line: any) => line.DetailType === "SalesItemLineDetail")
      .map((line: any) => ({
        id: line.Id,
        description: line.Description || line.SalesItemLineDetail?.ItemRef?.name,
        quantity: line.SalesItemLineDetail?.Qty || 0,
        unitPrice: line.SalesItemLineDetail?.UnitPrice || 0,
        amount: line.Amount || 0,
        taxAmount: line.TxnTaxDetail?.TaxLine?.[0]?.TaxLineDetail?.TaxPercent || 0,
      }));

    return {
      id: qbInvoice.Id,
      externalId: qbInvoice.Id,
      invoiceNumber: qbInvoice.DocNumber,
      customerId: qbInvoice.CustomerRef?.value,
      customerName: qbInvoice.CustomerRef?.name,
      issueDate: new Date(qbInvoice.TxnDate),
      dueDate: qbInvoice.DueDate ? new Date(qbInvoice.DueDate) : undefined,
      status: this.mapQBInvoiceStatus(qbInvoice.Balance, qbInvoice.TotalAmt),
      lineItems,
      subtotal: qbInvoice.TxnTaxDetail?.TotalTax ? qbInvoice.TotalAmt - qbInvoice.TxnTaxDetail.TotalTax : qbInvoice.TotalAmt,
      taxTotal: qbInvoice.TxnTaxDetail?.TotalTax || 0,
      total: qbInvoice.TotalAmt,
      amountPaid: qbInvoice.TotalAmt - qbInvoice.Balance,
      amountDue: qbInvoice.Balance,
      currencyCode: qbInvoice.CurrencyRef?.value || "USD",
      billingAddress: qbInvoice.BillAddr ? {
        line1: qbInvoice.BillAddr.Line1,
        city: qbInvoice.BillAddr.City,
        state: qbInvoice.BillAddr.CountrySubDivisionCode,
        postalCode: qbInvoice.BillAddr.PostalCode,
        country: qbInvoice.BillAddr.Country,
      } : undefined,
      notes: qbInvoice.CustomerMemo?.value,
      createdAt: qbInvoice.MetaData?.CreateTime ? new Date(qbInvoice.MetaData.CreateTime) : undefined,
      updatedAt: qbInvoice.MetaData?.LastUpdatedTime ? new Date(qbInvoice.MetaData.LastUpdatedTime) : undefined,
    };
  }

  private mapToQBInvoice(invoice: AccountingInvoice): any {
    return {
      CustomerRef: { value: invoice.customerId },
      TxnDate: invoice.issueDate.toISOString().split('T')[0],
      DueDate: invoice.dueDate?.toISOString().split('T')[0],
      DocNumber: invoice.invoiceNumber,
      Line: invoice.lineItems.map((item, index) => ({
        Id: item.id || String(index + 1),
        LineNum: index + 1,
        DetailType: "SalesItemLineDetail",
        Amount: item.amount,
        Description: item.description,
        SalesItemLineDetail: {
          Qty: item.quantity,
          UnitPrice: item.unitPrice,
          ItemRef: item.itemCode ? { value: item.itemCode } : undefined,
        },
      })),
      CustomerMemo: invoice.notes ? { value: invoice.notes } : undefined,
    };
  }

  private mapQBInvoiceStatus(balance: number, total: number): "draft" | "sent" | "paid" | "overdue" | "void" | "partial" {
    if (balance === 0) return "paid";
    if (balance === total) return "sent";
    if (balance > 0 && balance < total) return "partial";
    return "sent";
  }

  private mapQBPayment(qbPayment: any): AccountingPayment {
    return {
      id: qbPayment.Id,
      externalId: qbPayment.Id,
      invoiceId: qbPayment.Line?.[0]?.LinkedTxn?.[0]?.TxnId,
      customerId: qbPayment.CustomerRef?.value,
      paymentDate: new Date(qbPayment.TxnDate),
      amount: qbPayment.TotalAmt,
      currencyCode: qbPayment.CurrencyRef?.value || "USD",
      paymentMethod: qbPayment.PaymentMethodRef?.name,
      reference: qbPayment.PaymentRefNum,
      createdAt: qbPayment.MetaData?.CreateTime ? new Date(qbPayment.MetaData.CreateTime) : undefined,
      updatedAt: qbPayment.MetaData?.LastUpdatedTime ? new Date(qbPayment.MetaData.LastUpdatedTime) : undefined,
    };
  }

  private mapToQBPayment(payment: AccountingPayment): any {
    return {
      CustomerRef: { value: payment.customerId },
      TotalAmt: payment.amount,
      TxnDate: payment.paymentDate.toISOString().split('T')[0],
      PaymentRefNum: payment.reference,
      Line: [{
        Amount: payment.amount,
        LinkedTxn: payment.invoiceId ? [{
          TxnId: payment.invoiceId,
          TxnType: "Invoice",
        }] : undefined,
      }],
    };
  }

  private mapQBAccount(qbAccount: any): AccountingAccount {
    return {
      id: qbAccount.Id,
      externalId: qbAccount.Id,
      code: qbAccount.AcctNum || qbAccount.Id,
      name: qbAccount.Name,
      type: this.mapQBAccountType(qbAccount.AccountType),
      classification: qbAccount.Classification,
      description: qbAccount.Description,
      currencyCode: qbAccount.CurrencyRef?.value,
      balance: qbAccount.CurrentBalance,
      isActive: qbAccount.Active,
      parentAccountId: qbAccount.ParentRef?.value,
    };
  }

  private mapQBAccountType(qbType: string): "asset" | "liability" | "equity" | "revenue" | "expense" | "bank" {
    const typeMap: Record<string, "asset" | "liability" | "equity" | "revenue" | "expense" | "bank"> = {
      "Bank": "bank",
      "Other Current Asset": "asset",
      "Fixed Asset": "asset",
      "Other Asset": "asset",
      "Accounts Receivable": "asset",
      "Accounts Payable": "liability",
      "Credit Card": "liability",
      "Long Term Liability": "liability",
      "Other Current Liability": "liability",
      "Equity": "equity",
      "Income": "revenue",
      "Other Income": "revenue",
      "Expense": "expense",
      "Other Expense": "expense",
      "Cost of Goods Sold": "expense",
    };
    return typeMap[qbType] || "asset";
  }

  private mapQBItem(qbItem: any): AccountingItem {
    return {
      id: qbItem.Id,
      externalId: qbItem.Id,
      name: qbItem.Name,
      sku: qbItem.Sku,
      description: qbItem.Description,
      type: qbItem.Type === "Service" ? "service" : qbItem.Type === "Inventory" ? "inventory" : "non_inventory",
      unitPrice: qbItem.UnitPrice,
      purchasePrice: qbItem.PurchaseCost,
      quantityOnHand: qbItem.QtyOnHand,
      incomeAccountId: qbItem.IncomeAccountRef?.value,
      expenseAccountId: qbItem.ExpenseAccountRef?.value,
      assetAccountId: qbItem.AssetAccountRef?.value,
      taxable: qbItem.Taxable,
      isActive: qbItem.Active,
    };
  }

  private mapToQBItem(item: AccountingItem): any {
    return {
      Name: item.name,
      Sku: item.sku,
      Description: item.description,
      Type: item.type === "service" ? "Service" : item.type === "inventory" ? "Inventory" : "NonInventory",
      UnitPrice: item.unitPrice,
      PurchaseCost: item.purchasePrice,
      QtyOnHand: item.quantityOnHand,
      IncomeAccountRef: item.incomeAccountId ? { value: item.incomeAccountId } : undefined,
      ExpenseAccountRef: item.expenseAccountId ? { value: item.expenseAccountId } : undefined,
      AssetAccountRef: item.assetAccountId ? { value: item.assetAccountId } : undefined,
      Taxable: item.taxable,
      Active: item.isActive,
    };
  }

  private mapQBVendor(qbVendor: any): AccountingVendor {
    return {
      id: qbVendor.Id,
      externalId: qbVendor.Id,
      displayName: qbVendor.DisplayName,
      firstName: qbVendor.GivenName,
      lastName: qbVendor.FamilyName,
      companyName: qbVendor.CompanyName,
      email: qbVendor.PrimaryEmailAddr?.Address,
      phone: qbVendor.PrimaryPhone?.FreeFormNumber,
      website: qbVendor.WebAddr?.URI,
      billingAddress: qbVendor.BillAddr ? {
        line1: qbVendor.BillAddr.Line1,
        city: qbVendor.BillAddr.City,
        state: qbVendor.BillAddr.CountrySubDivisionCode,
        postalCode: qbVendor.BillAddr.PostalCode,
        country: qbVendor.BillAddr.Country,
      } : undefined,
      balance: qbVendor.Balance,
      currencyCode: qbVendor.CurrencyRef?.value,
      taxNumber: qbVendor.TaxIdentifier,
      accountNumber: qbVendor.AcctNum,
      notes: qbVendor.Notes,
    };
  }

  private mapToQBVendor(vendor: AccountingVendor): any {
    return {
      DisplayName: vendor.displayName,
      GivenName: vendor.firstName,
      FamilyName: vendor.lastName,
      CompanyName: vendor.companyName,
      PrimaryEmailAddr: vendor.email ? { Address: vendor.email } : undefined,
      PrimaryPhone: vendor.phone ? { FreeFormNumber: vendor.phone } : undefined,
      WebAddr: vendor.website ? { URI: vendor.website } : undefined,
      BillAddr: vendor.billingAddress ? {
        Line1: vendor.billingAddress.line1,
        City: vendor.billingAddress.city,
        CountrySubDivisionCode: vendor.billingAddress.state,
        PostalCode: vendor.billingAddress.postalCode,
        Country: vendor.billingAddress.country,
      } : undefined,
      AcctNum: vendor.accountNumber,
      Notes: vendor.notes,
    };
  }

  private mapQBBill(qbBill: any): AccountingBill {
    const lineItems: InvoiceLineItem[] = (qbBill.Line || [])
      .filter((line: any) => line.DetailType === "AccountBasedExpenseLineDetail" || line.DetailType === "ItemBasedExpenseLineDetail")
      .map((line: any) => ({
        id: line.Id,
        description: line.Description,
        quantity: line.ItemBasedExpenseLineDetail?.Qty || 1,
        unitPrice: line.ItemBasedExpenseLineDetail?.UnitPrice || line.Amount,
        amount: line.Amount || 0,
      }));

    return {
      id: qbBill.Id,
      externalId: qbBill.Id,
      billNumber: qbBill.DocNumber,
      vendorId: qbBill.VendorRef?.value,
      vendorName: qbBill.VendorRef?.name,
      issueDate: new Date(qbBill.TxnDate),
      dueDate: qbBill.DueDate ? new Date(qbBill.DueDate) : undefined,
      status: this.mapQBBillStatus(qbBill.Balance, qbBill.TotalAmt),
      lineItems,
      subtotal: qbBill.TotalAmt,
      taxTotal: 0,
      total: qbBill.TotalAmt,
      amountPaid: qbBill.TotalAmt - qbBill.Balance,
      amountDue: qbBill.Balance,
      currencyCode: qbBill.CurrencyRef?.value || "USD",
      notes: qbBill.PrivateNote,
    };
  }

  private mapToQBBill(bill: AccountingBill): any {
    return {
      VendorRef: { value: bill.vendorId },
      TxnDate: bill.issueDate.toISOString().split('T')[0],
      DueDate: bill.dueDate?.toISOString().split('T')[0],
      DocNumber: bill.billNumber,
      Line: bill.lineItems.map((item, index) => ({
        Id: item.id || String(index + 1),
        LineNum: index + 1,
        DetailType: "AccountBasedExpenseLineDetail",
        Amount: item.amount,
        Description: item.description,
      })),
      PrivateNote: bill.notes,
    };
  }

  private mapQBBillStatus(balance: number, total: number): "draft" | "open" | "paid" | "overdue" | "void" {
    if (balance === 0) return "paid";
    if (balance === total) return "open";
    return "open";
  }
}
