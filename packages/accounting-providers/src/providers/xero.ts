import { XeroClient, Contact, Invoice, Payment, Account, Item, LineItem } from "xero-node";
import { logger } from "@midday/logger";
import type {
  IAccountingProvider,
  XeroCredentials,
  AccountingCustomer,
  AccountingInvoice,
  AccountingPayment,
  AccountingAccount,
  AccountingItem,
  AccountingVendor,
  AccountingBill,
  InvoiceLineItem as CustomLineItem,
} from "../types";

export class XeroProvider implements IAccountingProvider {
  private xero: XeroClient;
  private credentials: XeroCredentials;

  constructor(credentials: XeroCredentials) {
    this.credentials = credentials;
    this.initializeClient();
  }

  private initializeClient(): void {
    this.xero = new XeroClient({
      clientId: this.credentials.clientId,
      clientSecret: this.credentials.clientSecret,
      redirectUris: [], // Will be set when needed
      scopes: [
        "openid",
        "profile",
        "email",
        "accounting.transactions",
        "accounting.contacts",
        "accounting.settings",
        "offline_access",
      ].join(" ").split(" "),
    });

    if (this.credentials.accessToken) {
      this.xero.setTokenSet({
        access_token: this.credentials.accessToken,
        refresh_token: this.credentials.refreshToken,
        expires_at: this.credentials.expiryDate,
      });
    }
  }

  async getAuthUrl(redirectUri: string, state?: string): Promise<string> {
    return this.xero.buildConsentUrl();
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<any> {
    const tokenSet = await this.xero.apiCallback(redirectUri);
    this.credentials.accessToken = tokenSet.access_token;
    this.credentials.refreshToken = tokenSet.refresh_token;
    this.credentials.expiryDate = tokenSet.expires_at ? tokenSet.expires_at * 1000 : Date.now() + 1800000;

    this.initializeClient();

    return tokenSet;
  }

  async refreshAccessToken(): Promise<void> {
    const tokenSet = await this.xero.refreshToken();
    this.credentials.accessToken = tokenSet.access_token;
    this.credentials.refreshToken = tokenSet.refresh_token;
    this.credentials.expiryDate = tokenSet.expires_at ? tokenSet.expires_at * 1000 : Date.now() + 1800000;

    this.initializeClient();
  }

  getCredentials(): XeroCredentials {
    return { ...this.credentials };
  }

  // Customers (Contacts in Xero)
  async getCustomers(options?: { modifiedSince?: Date; maxResults?: number }): Promise<AccountingCustomer[]> {
    try {
      const response = await this.xero.accountingApi.getContacts(
        this.credentials.tenantId,
        options?.modifiedSince,
        undefined,
        undefined,
        undefined,
        options?.maxResults
      );

      return (response.body.contacts || [])
        .filter(contact => !contact.isSupplier)
        .map(this.mapXeroContact.bind(this));
    } catch (error) {
      logger.error("Xero getCustomers failed", { error });
      throw error;
    }
  }

  async getCustomer(id: string): Promise<AccountingCustomer | null> {
    try {
      const response = await this.xero.accountingApi.getContact(
        this.credentials.tenantId,
        id
      );

      const contact = response.body.contacts?.[0];
      return contact ? this.mapXeroContact(contact) : null;
    } catch (error) {
      logger.error("Xero getCustomer failed", { error, id });
      throw error;
    }
  }

  async createCustomer(customer: AccountingCustomer): Promise<AccountingCustomer> {
    try {
      const xeroContact = this.mapToXeroContact(customer);
      const response = await this.xero.accountingApi.createContacts(
        this.credentials.tenantId,
        { contacts: [xeroContact] }
      );

      const created = response.body.contacts?.[0];
      if (!created) {
        throw new Error("Failed to create customer");
      }

      return this.mapXeroContact(created);
    } catch (error) {
      logger.error("Xero createCustomer failed", { error, customer });
      throw error;
    }
  }

  async updateCustomer(id: string, customer: Partial<AccountingCustomer>): Promise<AccountingCustomer> {
    try {
      const existing = await this.getCustomer(id);
      if (!existing) {
        throw new Error(`Customer ${id} not found`);
      }

      const updated = { ...existing, ...customer };
      const xeroContact = this.mapToXeroContact(updated);
      xeroContact.contactID = id;

      const response = await this.xero.accountingApi.updateContact(
        this.credentials.tenantId,
        id,
        { contacts: [xeroContact] }
      );

      const result = response.body.contacts?.[0];
      if (!result) {
        throw new Error("Failed to update customer");
      }

      return this.mapXeroContact(result);
    } catch (error) {
      logger.error("Xero updateCustomer failed", { error, id });
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      // Xero doesn't support deleting contacts, so we archive them instead
      const contact = { contactID: id, contactStatus: Contact.ContactStatusEnum.ARCHIVED };
      await this.xero.accountingApi.updateContact(
        this.credentials.tenantId,
        id,
        { contacts: [contact as Contact] }
      );
    } catch (error) {
      logger.error("Xero deleteCustomer failed", { error, id });
      throw error;
    }
  }

  // Invoices
  async getInvoices(options?: { modifiedSince?: Date; status?: string; maxResults?: number }): Promise<AccountingInvoice[]> {
    try {
      const statusFilter = options?.status ? [options.status] : undefined;
      const response = await this.xero.accountingApi.getInvoices(
        this.credentials.tenantId,
        options?.modifiedSince,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        statusFilter,
        undefined,
        undefined,
        undefined,
        undefined,
        options?.maxResults
      );

      return (response.body.invoices || [])
        .filter(invoice => invoice.type === Invoice.TypeEnum.ACCREC) // Only AR invoices
        .map(this.mapXeroInvoice.bind(this));
    } catch (error) {
      logger.error("Xero getInvoices failed", { error });
      throw error;
    }
  }

  async getInvoice(id: string): Promise<AccountingInvoice | null> {
    try {
      const response = await this.xero.accountingApi.getInvoice(
        this.credentials.tenantId,
        id
      );

      const invoice = response.body.invoices?.[0];
      return invoice ? this.mapXeroInvoice(invoice) : null;
    } catch (error) {
      logger.error("Xero getInvoice failed", { error, id });
      throw error;
    }
  }

  async createInvoice(invoice: AccountingInvoice): Promise<AccountingInvoice> {
    try {
      const xeroInvoice = this.mapToXeroInvoice(invoice);
      const response = await this.xero.accountingApi.createInvoices(
        this.credentials.tenantId,
        { invoices: [xeroInvoice] }
      );

      const created = response.body.invoices?.[0];
      if (!created) {
        throw new Error("Failed to create invoice");
      }

      return this.mapXeroInvoice(created);
    } catch (error) {
      logger.error("Xero createInvoice failed", { error, invoice });
      throw error;
    }
  }

  async updateInvoice(id: string, invoice: Partial<AccountingInvoice>): Promise<AccountingInvoice> {
    try {
      const existing = await this.getInvoice(id);
      if (!existing) {
        throw new Error(`Invoice ${id} not found`);
      }

      const updated = { ...existing, ...invoice };
      const xeroInvoice = this.mapToXeroInvoice(updated);
      xeroInvoice.invoiceID = id;

      const response = await this.xero.accountingApi.updateInvoice(
        this.credentials.tenantId,
        id,
        { invoices: [xeroInvoice] }
      );

      const result = response.body.invoices?.[0];
      if (!result) {
        throw new Error("Failed to update invoice");
      }

      return this.mapXeroInvoice(result);
    } catch (error) {
      logger.error("Xero updateInvoice failed", { error, id });
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      const invoice = { invoiceID: id, status: Invoice.StatusEnum.DELETED };
      await this.xero.accountingApi.updateInvoice(
        this.credentials.tenantId,
        id,
        { invoices: [invoice as Invoice] }
      );
    } catch (error) {
      logger.error("Xero deleteInvoice failed", { error, id });
      throw error;
    }
  }

  async sendInvoice(id: string, email?: string): Promise<void> {
    try {
      await this.xero.accountingApi.emailInvoice(
        this.credentials.tenantId,
        id,
        {}
      );
    } catch (error) {
      logger.error("Xero sendInvoice failed", { error, id });
      throw error;
    }
  }

  // Payments
  async getPayments(options?: { modifiedSince?: Date; maxResults?: number }): Promise<AccountingPayment[]> {
    try {
      const response = await this.xero.accountingApi.getPayments(
        this.credentials.tenantId,
        options?.modifiedSince,
        undefined,
        options?.maxResults
      );

      return (response.body.payments || []).map(this.mapXeroPayment.bind(this));
    } catch (error) {
      logger.error("Xero getPayments failed", { error });
      throw error;
    }
  }

  async getPayment(id: string): Promise<AccountingPayment | null> {
    try {
      const response = await this.xero.accountingApi.getPayment(
        this.credentials.tenantId,
        id
      );

      const payment = response.body.payments?.[0];
      return payment ? this.mapXeroPayment(payment) : null;
    } catch (error) {
      logger.error("Xero getPayment failed", { error, id });
      throw error;
    }
  }

  async createPayment(payment: AccountingPayment): Promise<AccountingPayment> {
    try {
      const xeroPayment = this.mapToXeroPayment(payment);
      const response = await this.xero.accountingApi.createPayments(
        this.credentials.tenantId,
        { payments: [xeroPayment] }
      );

      const created = response.body.payments?.[0];
      if (!created) {
        throw new Error("Failed to create payment");
      }

      return this.mapXeroPayment(created);
    } catch (error) {
      logger.error("Xero createPayment failed", { error, payment });
      throw error;
    }
  }

  // Accounts
  async getAccounts(): Promise<AccountingAccount[]> {
    try {
      const response = await this.xero.accountingApi.getAccounts(
        this.credentials.tenantId
      );

      return (response.body.accounts || []).map(this.mapXeroAccount.bind(this));
    } catch (error) {
      logger.error("Xero getAccounts failed", { error });
      throw error;
    }
  }

  async getAccount(id: string): Promise<AccountingAccount | null> {
    try {
      const response = await this.xero.accountingApi.getAccount(
        this.credentials.tenantId,
        id
      );

      const account = response.body.accounts?.[0];
      return account ? this.mapXeroAccount(account) : null;
    } catch (error) {
      logger.error("Xero getAccount failed", { error, id });
      throw error;
    }
  }

  // Items
  async getItems(options?: { isActive?: boolean; maxResults?: number }): Promise<AccountingItem[]> {
    try {
      const response = await this.xero.accountingApi.getItems(
        this.credentials.tenantId
      );

      let items = response.body.items || [];

      if (options?.isActive !== undefined) {
        items = items.filter(item =>
          options.isActive ? item.code !== "DELETED" : item.code === "DELETED"
        );
      }

      if (options?.maxResults) {
        items = items.slice(0, options.maxResults);
      }

      return items.map(this.mapXeroItem.bind(this));
    } catch (error) {
      logger.error("Xero getItems failed", { error });
      throw error;
    }
  }

  async getItem(id: string): Promise<AccountingItem | null> {
    try {
      const response = await this.xero.accountingApi.getItem(
        this.credentials.tenantId,
        id
      );

      const item = response.body.items?.[0];
      return item ? this.mapXeroItem(item) : null;
    } catch (error) {
      logger.error("Xero getItem failed", { error, id });
      throw error;
    }
  }

  async createItem(item: AccountingItem): Promise<AccountingItem> {
    try {
      const xeroItem = this.mapToXeroItem(item);
      const response = await this.xero.accountingApi.createItems(
        this.credentials.tenantId,
        { items: [xeroItem] }
      );

      const created = response.body.items?.[0];
      if (!created) {
        throw new Error("Failed to create item");
      }

      return this.mapXeroItem(created);
    } catch (error) {
      logger.error("Xero createItem failed", { error, item });
      throw error;
    }
  }

  async updateItem(id: string, item: Partial<AccountingItem>): Promise<AccountingItem> {
    try {
      const existing = await this.getItem(id);
      if (!existing) {
        throw new Error(`Item ${id} not found`);
      }

      const updated = { ...existing, ...item };
      const xeroItem = this.mapToXeroItem(updated);
      xeroItem.itemID = id;

      const response = await this.xero.accountingApi.updateItem(
        this.credentials.tenantId,
        id,
        { items: [xeroItem] }
      );

      const result = response.body.items?.[0];
      if (!result) {
        throw new Error("Failed to update item");
      }

      return this.mapXeroItem(result);
    } catch (error) {
      logger.error("Xero updateItem failed", { error, id });
      throw error;
    }
  }

  // Vendors (Suppliers in Xero)
  async getVendors(options?: { modifiedSince?: Date; maxResults?: number }): Promise<AccountingVendor[]> {
    try {
      const response = await this.xero.accountingApi.getContacts(
        this.credentials.tenantId,
        options?.modifiedSince,
        undefined,
        undefined,
        undefined,
        options?.maxResults
      );

      return (response.body.contacts || [])
        .filter(contact => contact.isSupplier)
        .map(this.mapXeroVendor.bind(this));
    } catch (error) {
      logger.error("Xero getVendors failed", { error });
      throw error;
    }
  }

  async getVendor(id: string): Promise<AccountingVendor | null> {
    try {
      const response = await this.xero.accountingApi.getContact(
        this.credentials.tenantId,
        id
      );

      const contact = response.body.contacts?.[0];
      return contact ? this.mapXeroVendor(contact) : null;
    } catch (error) {
      logger.error("Xero getVendor failed", { error, id });
      throw error;
    }
  }

  async createVendor(vendor: AccountingVendor): Promise<AccountingVendor> {
    try {
      const xeroContact = this.mapToXeroVendor(vendor);
      const response = await this.xero.accountingApi.createContacts(
        this.credentials.tenantId,
        { contacts: [xeroContact] }
      );

      const created = response.body.contacts?.[0];
      if (!created) {
        throw new Error("Failed to create vendor");
      }

      return this.mapXeroVendor(created);
    } catch (error) {
      logger.error("Xero createVendor failed", { error, vendor });
      throw error;
    }
  }

  async updateVendor(id: string, vendor: Partial<AccountingVendor>): Promise<AccountingVendor> {
    try {
      const existing = await this.getVendor(id);
      if (!existing) {
        throw new Error(`Vendor ${id} not found`);
      }

      const updated = { ...existing, ...vendor };
      const xeroContact = this.mapToXeroVendor(updated);
      xeroContact.contactID = id;

      const response = await this.xero.accountingApi.updateContact(
        this.credentials.tenantId,
        id,
        { contacts: [xeroContact] }
      );

      const result = response.body.contacts?.[0];
      if (!result) {
        throw new Error("Failed to update vendor");
      }

      return this.mapXeroVendor(result);
    } catch (error) {
      logger.error("Xero updateVendor failed", { error, id });
      throw error;
    }
  }

  // Bills
  async getBills(options?: { modifiedSince?: Date; status?: string; maxResults?: number }): Promise<AccountingBill[]> {
    try {
      const statusFilter = options?.status ? [options.status] : undefined;
      const response = await this.xero.accountingApi.getInvoices(
        this.credentials.tenantId,
        options?.modifiedSince,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        statusFilter,
        undefined,
        undefined,
        undefined,
        undefined,
        options?.maxResults
      );

      return (response.body.invoices || [])
        .filter(invoice => invoice.type === Invoice.TypeEnum.ACCPAY) // Only AP bills
        .map(this.mapXeroBill.bind(this));
    } catch (error) {
      logger.error("Xero getBills failed", { error });
      throw error;
    }
  }

  async getBill(id: string): Promise<AccountingBill | null> {
    try {
      const response = await this.xero.accountingApi.getInvoice(
        this.credentials.tenantId,
        id
      );

      const invoice = response.body.invoices?.[0];
      return invoice ? this.mapXeroBill(invoice) : null;
    } catch (error) {
      logger.error("Xero getBill failed", { error, id });
      throw error;
    }
  }

  async createBill(bill: AccountingBill): Promise<AccountingBill> {
    try {
      const xeroBill = this.mapToXeroBill(bill);
      const response = await this.xero.accountingApi.createInvoices(
        this.credentials.tenantId,
        { invoices: [xeroBill] }
      );

      const created = response.body.invoices?.[0];
      if (!created) {
        throw new Error("Failed to create bill");
      }

      return this.mapXeroBill(created);
    } catch (error) {
      logger.error("Xero createBill failed", { error, bill });
      throw error;
    }
  }

  async updateBill(id: string, bill: Partial<AccountingBill>): Promise<AccountingBill> {
    try {
      const existing = await this.getBill(id);
      if (!existing) {
        throw new Error(`Bill ${id} not found`);
      }

      const updated = { ...existing, ...bill };
      const xeroBill = this.mapToXeroBill(updated);
      xeroBill.invoiceID = id;

      const response = await this.xero.accountingApi.updateInvoice(
        this.credentials.tenantId,
        id,
        { invoices: [xeroBill] }
      );

      const result = response.body.invoices?.[0];
      if (!result) {
        throw new Error("Failed to update bill");
      }

      return this.mapXeroBill(result);
    } catch (error) {
      logger.error("Xero updateBill failed", { error, id });
      throw error;
    }
  }

  // Utility
  async getCompanyInfo(): Promise<any> {
    try {
      const response = await this.xero.accountingApi.getOrganisations(
        this.credentials.tenantId
      );

      return response.body.organisations?.[0];
    } catch (error) {
      logger.error("Xero getCompanyInfo failed", { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.tokenExpiryTimeout) {
      clearTimeout(this.tokenExpiryTimeout);
    }
    await this.xero.disconnect(this.credentials.tenantId);
  }

  // Mapping functions from Xero to our format
  private mapXeroContact(xeroContact: Contact): AccountingCustomer {
    return {
      id: xeroContact.contactID,
      externalId: xeroContact.contactID,
      displayName: xeroContact.name || "",
      firstName: xeroContact.firstName,
      lastName: xeroContact.lastName,
      companyName: xeroContact.name,
      email: xeroContact.emailAddress,
      phone: xeroContact.phones?.[0]?.phoneNumber,
      website: xeroContact.website,
      billingAddress: xeroContact.addresses?.[0] ? {
        line1: xeroContact.addresses[0].addressLine1,
        line2: xeroContact.addresses[0].addressLine2,
        city: xeroContact.addresses[0].city,
        state: xeroContact.addresses[0].region,
        postalCode: xeroContact.addresses[0].postalCode,
        country: xeroContact.addresses[0].country,
      } : undefined,
      taxNumber: xeroContact.taxNumber,
      currencyCode: xeroContact.defaultCurrency,
      notes: xeroContact.contactPersons?.[0]?.firstName,
    };
  }

  private mapToXeroContact(customer: AccountingCustomer): Contact {
    return {
      name: customer.displayName,
      firstName: customer.firstName,
      lastName: customer.lastName,
      emailAddress: customer.email,
      phones: customer.phone ? [{ phoneType: "DEFAULT" as any, phoneNumber: customer.phone }] : undefined,
      addresses: customer.billingAddress ? [{
        addressType: "POBOX" as any,
        addressLine1: customer.billingAddress.line1,
        addressLine2: customer.billingAddress.line2,
        city: customer.billingAddress.city,
        region: customer.billingAddress.state,
        postalCode: customer.billingAddress.postalCode,
        country: customer.billingAddress.country,
      }] : undefined,
      taxNumber: customer.taxNumber,
      isCustomer: true,
    };
  }

  private mapXeroInvoice(xeroInvoice: Invoice): AccountingInvoice {
    const lineItems: CustomLineItem[] = (xeroInvoice.lineItems || []).map(line => ({
      id: line.lineItemID,
      description: line.description || "",
      quantity: line.quantity || 0,
      unitPrice: line.unitAmount || 0,
      amount: line.lineAmount || 0,
      taxAmount: line.taxAmount,
      accountCode: line.accountCode,
      itemCode: line.itemCode,
    }));

    return {
      id: xeroInvoice.invoiceID,
      externalId: xeroInvoice.invoiceID,
      invoiceNumber: xeroInvoice.invoiceNumber || "",
      customerId: xeroInvoice.contact?.contactID || "",
      customerName: xeroInvoice.contact?.name,
      issueDate: xeroInvoice.date ? new Date(xeroInvoice.date) : new Date(),
      dueDate: xeroInvoice.dueDate ? new Date(xeroInvoice.dueDate) : undefined,
      status: this.mapXeroInvoiceStatus(xeroInvoice.status),
      lineItems,
      subtotal: xeroInvoice.subTotal || 0,
      taxTotal: xeroInvoice.totalTax || 0,
      total: xeroInvoice.total || 0,
      amountPaid: xeroInvoice.amountPaid || 0,
      amountDue: xeroInvoice.amountDue || 0,
      currencyCode: xeroInvoice.currencyCode || "USD",
      notes: xeroInvoice.reference,
    };
  }

  private mapToXeroInvoice(invoice: AccountingInvoice): Invoice {
    return {
      type: Invoice.TypeEnum.ACCREC,
      contact: { contactID: invoice.customerId },
      date: invoice.issueDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate?.toISOString().split('T')[0],
      invoiceNumber: invoice.invoiceNumber,
      reference: invoice.notes,
      lineItems: invoice.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitAmount: item.unitPrice,
        accountCode: item.accountCode,
        itemCode: item.itemCode,
      } as LineItem)),
      status: Invoice.StatusEnum.DRAFT,
    };
  }

  private mapXeroInvoiceStatus(status?: string): "draft" | "sent" | "paid" | "overdue" | "void" | "partial" {
    const statusMap: Record<string, "draft" | "sent" | "paid" | "overdue" | "void" | "partial"> = {
      DRAFT: "draft",
      SUBMITTED: "sent",
      AUTHORISED: "sent",
      PAID: "paid",
      VOIDED: "void",
      DELETED: "void",
    };
    return status ? statusMap[status] || "sent" : "draft";
  }

  private mapXeroPayment(xeroPayment: Payment): AccountingPayment {
    return {
      id: xeroPayment.paymentID,
      externalId: xeroPayment.paymentID,
      invoiceId: xeroPayment.invoice?.invoiceID || "",
      customerId: xeroPayment.invoice?.contact?.contactID || "",
      paymentDate: xeroPayment.date ? new Date(xeroPayment.date) : new Date(),
      amount: xeroPayment.amount || 0,
      currencyCode: xeroPayment.currencyRate ? "USD" : "USD",
      reference: xeroPayment.reference,
    };
  }

  private mapToXeroPayment(payment: AccountingPayment): Payment {
    return {
      invoice: { invoiceID: payment.invoiceId },
      account: { code: "1234" }, // This should be mapped from actual account
      date: payment.paymentDate.toISOString().split('T')[0],
      amount: payment.amount,
      reference: payment.reference,
    };
  }

  private mapXeroAccount(xeroAccount: Account): AccountingAccount {
    return {
      id: xeroAccount.accountID,
      externalId: xeroAccount.accountID,
      code: xeroAccount.code || "",
      name: xeroAccount.name || "",
      type: this.mapXeroAccountType(xeroAccount.type),
      classification: xeroAccount.class,
      description: xeroAccount.description,
      currencyCode: xeroAccount.currencyCode,
      taxType: xeroAccount.taxType,
      isActive: xeroAccount.status === Account.StatusEnum.ACTIVE,
    };
  }

  private mapXeroAccountType(xeroType?: string): "asset" | "liability" | "equity" | "revenue" | "expense" | "bank" {
    const typeMap: Record<string, "asset" | "liability" | "equity" | "revenue" | "expense" | "bank"> = {
      BANK: "bank",
      CURRENT: "asset",
      CURRLIAB: "liability",
      DEPRECIATN: "expense",
      DIRECTCOSTS: "expense",
      EQUITY: "equity",
      EXPENSE: "expense",
      FIXED: "asset",
      INVENTORY: "asset",
      LIABILITY: "liability",
      NONCURRENT: "asset",
      OTHERINCOME: "revenue",
      OVERHEADS: "expense",
      PREPAYMENT: "asset",
      REVENUE: "revenue",
      SALES: "revenue",
      TERMLIAB: "liability",
      PAYGLIABILITY: "liability",
    };
    return xeroType ? typeMap[xeroType] || "asset" : "asset";
  }

  private mapXeroItem(xeroItem: Item): AccountingItem {
    return {
      id: xeroItem.itemID,
      externalId: xeroItem.itemID,
      name: xeroItem.name || "",
      sku: xeroItem.code,
      description: xeroItem.description,
      type: xeroItem.isTrackedAsInventory ? "inventory" : "service",
      unitPrice: xeroItem.salesDetails?.unitPrice,
      purchasePrice: xeroItem.purchaseDetails?.unitPrice,
      quantityOnHand: xeroItem.quantityOnHand,
      incomeAccountId: xeroItem.salesDetails?.accountCode,
      expenseAccountId: xeroItem.purchaseDetails?.accountCode,
      taxable: xeroItem.isSold || xeroItem.isPurchased,
      isActive: xeroItem.code !== "DELETED",
    };
  }

  private mapToXeroItem(item: AccountingItem): Item {
    return {
      code: item.sku || item.name,
      name: item.name,
      description: item.description,
      isTrackedAsInventory: item.type === "inventory",
      isSold: true,
      isPurchased: item.purchasePrice !== undefined,
      salesDetails: {
        unitPrice: item.unitPrice,
        accountCode: item.incomeAccountId,
      },
      purchaseDetails: item.purchasePrice ? {
        unitPrice: item.purchasePrice,
        accountCode: item.expenseAccountId,
      } : undefined,
    };
  }

  private mapXeroVendor(xeroContact: Contact): AccountingVendor {
    return {
      id: xeroContact.contactID,
      externalId: xeroContact.contactID,
      displayName: xeroContact.name || "",
      firstName: xeroContact.firstName,
      lastName: xeroContact.lastName,
      companyName: xeroContact.name,
      email: xeroContact.emailAddress,
      phone: xeroContact.phones?.[0]?.phoneNumber,
      website: xeroContact.website,
      billingAddress: xeroContact.addresses?.[0] ? {
        line1: xeroContact.addresses[0].addressLine1,
        line2: xeroContact.addresses[0].addressLine2,
        city: xeroContact.addresses[0].city,
        state: xeroContact.addresses[0].region,
        postalCode: xeroContact.addresses[0].postalCode,
        country: xeroContact.addresses[0].country,
      } : undefined,
      taxNumber: xeroContact.taxNumber,
      currencyCode: xeroContact.defaultCurrency,
      accountNumber: xeroContact.accountNumber,
    };
  }

  private mapToXeroVendor(vendor: AccountingVendor): Contact {
    return {
      name: vendor.displayName,
      firstName: vendor.firstName,
      lastName: vendor.lastName,
      emailAddress: vendor.email,
      phones: vendor.phone ? [{ phoneType: "DEFAULT" as any, phoneNumber: vendor.phone }] : undefined,
      addresses: vendor.billingAddress ? [{
        addressType: "POBOX" as any,
        addressLine1: vendor.billingAddress.line1,
        addressLine2: vendor.billingAddress.line2,
        city: vendor.billingAddress.city,
        region: vendor.billingAddress.state,
        postalCode: vendor.billingAddress.postalCode,
        country: vendor.billingAddress.country,
      }] : undefined,
      taxNumber: vendor.taxNumber,
      accountNumber: vendor.accountNumber,
      isSupplier: true,
    };
  }

  private mapXeroBill(xeroInvoice: Invoice): AccountingBill {
    const lineItems: CustomLineItem[] = (xeroInvoice.lineItems || []).map(line => ({
      id: line.lineItemID,
      description: line.description || "",
      quantity: line.quantity || 0,
      unitPrice: line.unitAmount || 0,
      amount: line.lineAmount || 0,
      taxAmount: line.taxAmount,
      accountCode: line.accountCode,
    }));

    return {
      id: xeroInvoice.invoiceID,
      externalId: xeroInvoice.invoiceID,
      billNumber: xeroInvoice.invoiceNumber,
      vendorId: xeroInvoice.contact?.contactID || "",
      vendorName: xeroInvoice.contact?.name,
      issueDate: xeroInvoice.date ? new Date(xeroInvoice.date) : new Date(),
      dueDate: xeroInvoice.dueDate ? new Date(xeroInvoice.dueDate) : undefined,
      status: this.mapXeroBillStatus(xeroInvoice.status),
      lineItems,
      subtotal: xeroInvoice.subTotal || 0,
      taxTotal: xeroInvoice.totalTax || 0,
      total: xeroInvoice.total || 0,
      amountPaid: xeroInvoice.amountPaid || 0,
      amountDue: xeroInvoice.amountDue || 0,
      currencyCode: xeroInvoice.currencyCode || "USD",
      notes: xeroInvoice.reference,
    };
  }

  private mapToXeroBill(bill: AccountingBill): Invoice {
    return {
      type: Invoice.TypeEnum.ACCPAY,
      contact: { contactID: bill.vendorId },
      date: bill.issueDate.toISOString().split('T')[0],
      dueDate: bill.dueDate?.toISOString().split('T')[0],
      invoiceNumber: bill.billNumber,
      reference: bill.notes,
      lineItems: bill.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitAmount: item.unitPrice,
        accountCode: item.accountCode,
      } as LineItem)),
      status: Invoice.StatusEnum.DRAFT,
    };
  }

  private mapXeroBillStatus(status?: string): "draft" | "open" | "paid" | "overdue" | "void" {
    const statusMap: Record<string, "draft" | "open" | "paid" | "overdue" | "void"> = {
      DRAFT: "draft",
      SUBMITTED: "open",
      AUTHORISED: "open",
      PAID: "paid",
      VOIDED: "void",
      DELETED: "void",
    };
    return status ? statusMap[status] || "open" : "draft";
  }
}
