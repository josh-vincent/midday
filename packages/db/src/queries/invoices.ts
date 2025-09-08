import type { Database } from "@db/client";
import { customers, invoiceStatusEnum, invoices, teams } from "@db/schema";
import { buildSearchQuery } from "@midday/db/utils/search-query";
import { generateToken } from "@midday/invoice/token";
import type { EditorDoc, LineItem } from "@midday/invoice/types";
import camelcaseKeys from "camelcase-keys";
import { addMonths } from "date-fns";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm/sql/sql";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "../utils/log-activity";

export type Template = {
  customerLabel: string;
  title: string;
  fromLabel: string;
  invoiceNoLabel: string;
  issueDateLabel: string;
  dueDateLabel: string;
  descriptionLabel: string;
  priceLabel: string;
  quantityLabel: string;
  totalLabel: string;
  totalSummaryLabel: string;
  vatLabel: string;
  subtotalLabel: string;
  taxLabel: string;
  discountLabel: string;
  timezone: string;
  paymentLabel: string;
  noteLabel: string;
  logoUrl: string | null;
  currency: string;
  paymentDetails: EditorDoc | null;
  fromDetails: EditorDoc | null;
  dateFormat: string;
  includeVat: boolean;
  includeTax: boolean;
  includeDiscount: boolean;
  includeDecimals: boolean;
  includeUnits: boolean;
  includeQr: boolean;
  taxRate: number;
  vatRate: number;
  size: "a4" | "letter";
  deliveryType: "create" | "create_and_send" | "scheduled";
  locale: string;
};

export type GetInvoicesParams = {
  teamId: string;
  cursor?: string | null;
  pageSize?: number;
  q?: string | null;
  statuses?: string[] | null;
  customers?: string[] | null;
  start?: string | null;
  end?: string | null;
  sort?: string[] | null;
};

export async function getInvoices(db: Database, params: GetInvoicesParams) {
  try {
    const {
      teamId,
      sort,
      cursor,
      pageSize = 25,
      q,
      statuses,
      start,
      end,
      customers: customerIds,
    } = params;

    const whereConditions: SQL[] = [eq(invoices.teamId, teamId)];

    // Apply status filter
    if (statuses && statuses.length > 0) {
      // Cast the statuses array to the correct enum type
      const validStatuses = statuses.filter((status) =>
        invoiceStatusEnum.enumValues.includes(
          status as (typeof invoiceStatusEnum.enumValues)[number],
        ),
      ) as (typeof invoiceStatusEnum.enumValues)[number][];

      if (validStatuses.length > 0) {
        whereConditions.push(inArray(invoices.status, validStatuses));
      }
    }

    // Apply date range filter
    if (start && end) {
      whereConditions.push(gte(invoices.dueDate, start));
      whereConditions.push(lte(invoices.dueDate, end));
    }

    // Apply customer filter
    if (customerIds && customerIds.length > 0) {
      whereConditions.push(inArray(invoices.customerId, customerIds));
    }

    // Apply search query filter
    if (q) {
      // If the query is a number, search by amount
      if (!Number.isNaN(Number.parseInt(q))) {
        whereConditions.push(
          sql`${invoices.amount}::text = ${Number(q).toString()}`,
        );
      } else {
        const query = buildSearchQuery(q);

        // Search using customerName
        whereConditions.push(
          sql`${invoices.customerName} ILIKE '%' || ${q} || '%'`,
        );
      }
    }

    // Start building the query
    const query = db
      .select({
        id: invoices.id,
        dueDate: invoices.dueDate,
        invoiceNumber: invoices.invoiceNumber,
        createdAt: invoices.createdAt,
        amount: invoices.amount,
        currency: invoices.currency,
        lineItems: invoices.lineItems,
        paymentDetails: invoices.paymentDetails,
        customerDetails: invoices.customerDetails,
        reminderSentAt: invoices.reminderSentAt,
        updatedAt: invoices.updatedAt,
        note: invoices.note,
        paidDate: invoices.paidDate,
        vat: invoices.vat,
        tax: invoices.tax,
        status: invoices.status,
        viewedAt: invoices.viewedAt,
        fromDetails: invoices.fromDetails,
        issueDate: invoices.issueDate,
        sentAt: invoices.sentAt,
        template: invoices.template,
        noteDetails: invoices.noteDetails,
        customerName: invoices.customerName,
        token: invoices.token,
        discount: invoices.discount,
        subtotal: invoices.subtotal,
        topBlock: invoices.topBlock,
        bottomBlock: invoices.bottomBlock,
        scheduledAt: invoices.scheduledAt,
        scheduledJobId: invoices.scheduledJobId,
        customer: {
          id: customers.id,
          name: customers.name,
          website: customers.website,
          email: customers.email,
        },
        customerId: invoices.customerId,
        team: {
          name: teams.name,
        },
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(teams, eq(invoices.teamId, teams.id))
      .where(and(...whereConditions));

    // Apply sorting
    if (sort && sort.length === 2) {
      const [column, direction] = sort;
      const isAscending = direction === "asc";

      if (column === "customer") {
        isAscending
          ? query.orderBy(asc(customers.name))
          : query.orderBy(desc(customers.name));
      } else if (column === "created_at") {
        isAscending
          ? query.orderBy(asc(invoices.createdAt))
          : query.orderBy(desc(invoices.createdAt));
      } else if (column === "due_date") {
        isAscending
          ? query.orderBy(asc(invoices.dueDate))
          : query.orderBy(desc(invoices.dueDate));
      } else if (column === "amount") {
        isAscending
          ? query.orderBy(asc(invoices.amount))
          : query.orderBy(desc(invoices.amount));
      } else if (column === "status") {
        isAscending
          ? query.orderBy(asc(invoices.status))
          : query.orderBy(desc(invoices.status));
      }
    } else {
      // Default sort by created_at descending
      query.orderBy(desc(invoices.createdAt));
    }

    // Apply pagination
    const offset = cursor ? Number.parseInt(cursor, 10) : 0;
    query.limit(pageSize).offset(offset);

    // Execute query
    const data = await query;

    // Calculate next cursor
    const nextCursor =
      data && data.length === pageSize
        ? (offset + pageSize).toString()
        : undefined;

    return {
      meta: {
        cursor: nextCursor ?? null,
        hasPreviousPage: offset > 0,
        hasNextPage: data && data.length === pageSize,
      },
      data,
    };
  } catch (error) {
    console.error("Error in getInvoices:", error);
    // Return empty results on error
    return {
      meta: {
        cursor: null,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      data: [],
    };
  }
}

export type GetInvoiceByIdParams = {
  id: string;
  teamId?: string;
};

export async function getInvoiceById(
  db: Database,
  params: GetInvoiceByIdParams,
) {
  const { id, teamId } = params;

  const [result] = await db
    .select({
      id: invoices.id,
      dueDate: invoices.dueDate,
      invoiceNumber: invoices.invoiceNumber,
      createdAt: invoices.createdAt,
      amount: invoices.amount,
      currency: invoices.currency,
      lineItems: invoices.lineItems,
      paymentDetails: invoices.paymentDetails,
      customerDetails: invoices.customerDetails,
      reminderSentAt: invoices.reminderSentAt,
      updatedAt: invoices.updatedAt,
      note: invoices.note,
      paidDate: invoices.paidDate,
      vat: invoices.vat,
      tax: invoices.tax,
      status: invoices.status,
      viewedAt: invoices.viewedAt,
      fromDetails: invoices.fromDetails,
      issueDate: invoices.issueDate,
      sentAt: invoices.sentAt,
      template: invoices.template,
      noteDetails: invoices.noteDetails,
      customerName: invoices.customerName,
      token: invoices.token,
      discount: invoices.discount,
      subtotal: invoices.subtotal,
      topBlock: invoices.topBlock,
      bottomBlock: invoices.bottomBlock,
      scheduledAt: invoices.scheduledAt,
      scheduledJobId: invoices.scheduledJobId,
      customer: {
        id: customers.id,
        name: customers.name,
        website: customers.website,
        email: customers.email,
      },
      customerId: invoices.customerId,
      team: {
        name: teams.name,
      },
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .leftJoin(teams, eq(invoices.teamId, teams.id))
    .where(
      and(
        eq(invoices.id, id),
        // This is when we use the token to get the invoice
        teamId !== undefined ? eq(invoices.teamId, teamId) : undefined,
      ),
    );

  if (!result) {
    return null;
  }

  return {
    ...result,
    template: camelcaseKeys(result?.template as Record<string, unknown>, {
      deep: true,
    }) as Template,
    lineItems: result.lineItems as LineItem[],
    paymentDetails: result.paymentDetails as EditorDoc | null,
    customerDetails: result.customerDetails as EditorDoc | null,
    fromDetails: result.fromDetails as EditorDoc | null,
    noteDetails: result.noteDetails as EditorDoc | null,
    topBlock: result.topBlock as EditorDoc | null,
    bottomBlock: result.bottomBlock as EditorDoc | null,
  };
}

type PaymentStatusResult = {
  score: number;
  paymentStatus: string;
};

type DbPaymentStatusResult = {
  score: number;
  payment_status: string;
};

export async function getPaymentStatus(
  db: Database,
  teamId: string,
): Promise<PaymentStatusResult> {
  try {
    // Use execute instead of executeOnReplica since we're using primary only
    const results = await db.execute(
      sql`SELECT * FROM get_payment_score(${teamId})`,
    );
    const result = Array.isArray(results)
      ? (results[0] as DbPaymentStatusResult)
      : undefined;

    if (!result) {
      console.error("No payment status result for team:", teamId);
      // Return default values instead of throwing
      return {
        score: 0,
        paymentStatus: "unknown",
      };
    }

    return {
      score: Number(result.score),
      paymentStatus: result.payment_status,
    };
  } catch (error) {
    console.error("Error in getPaymentStatus:", error);
    // Return safe defaults on error
    return {
      score: 0,
      paymentStatus: "unknown",
    };
  }
}

type SearchInvoiceNumberParams = {
  teamId: string;
  query: string;
};

export async function searchInvoiceNumber(
  db: Database,
  params: SearchInvoiceNumberParams,
) {
  const [result] = await db
    .select({
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, params.teamId),
        ilike(invoices.invoiceNumber, `%${params.query}`),
      ),
    )
    .limit(1);

  return result ?? null;
}

export async function getNextInvoiceNumber(
  db: Database,
  teamId: string,
): Promise<string> {
  try {
    // Use execute instead of executeOnReplica since we're using primary only
    const [row] = await db.execute(
      sql`SELECT get_next_invoice_number(${teamId}) AS next_invoice_number`,
    );

    if (!row) {
      console.error("No invoice number result for team:", teamId);
      // Generate a fallback invoice number
      const timestamp = Date.now().toString(36).toUpperCase();
      return `INV-${timestamp}`;
    }

    return row.next_invoice_number as string;
  } catch (error) {
    console.error("Error in getNextInvoiceNumber:", error);
    // Generate a fallback invoice number on error
    const timestamp = Date.now().toString(36).toUpperCase();
    return `INV-${timestamp}`;
  }
}

type DraftInvoiceLineItemParams = {
  name?: string;
  quantity?: number;
  unit?: string | null;
  price?: number;
  vat?: number;
  tax?: number;
};

type DraftInvoiceTemplateParams = {
  customerLabel?: string;
  title?: string;
  fromLabel?: string;
  invoiceNoLabel?: string;
  issueDateLabel?: string;
  dueDateLabel?: string;
  descriptionLabel?: string;
  priceLabel?: string;
  quantityLabel?: string;
  totalLabel?: string;
  totalSummaryLabel?: string;
  vatLabel?: string;
  subtotalLabel?: string;
  taxLabel?: string;
  discountLabel?: string;
  sendCopy?: boolean;
  timezone?: string;
  paymentLabel?: string;
  noteLabel?: string;
  logoUrl?: string | null;
  currency?: string;
  paymentDetails?: string | null;
  fromDetails?: string | null;
  dateFormat?: string;
  includeVat?: boolean;
  includeTax?: boolean;
  includeDiscount?: boolean;
  includeDecimals?: boolean;
  includeUnits?: boolean;
  includeQr?: boolean;
  taxRate?: number;
  vatRate?: number;
  size?: "a4" | "letter";
  deliveryType?: "create" | "create_and_send" | "scheduled";
  locale?: string;
};

type DraftInvoiceParams = {
  id: string;
  template: DraftInvoiceTemplateParams;
  fromDetails?: string | null;
  customerDetails?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  paymentDetails?: string | null;
  noteDetails?: string | null;
  dueDate: string;
  issueDate: string;
  invoiceNumber: string;
  logoUrl?: string | null;
  vat?: number | null;
  tax?: number | null;
  discount?: number | null;
  subtotal?: number | null;
  topBlock?: string | null;
  bottomBlock?: string | null;
  amount?: number | null;
  lineItems?: DraftInvoiceLineItemParams[];
  token?: string;
  teamId: string;
  userId: string;
};

export async function draftInvoice(db: Database, params: DraftInvoiceParams) {
  const {
    id,
    teamId,
    userId,
    token,
    template,
    paymentDetails,
    fromDetails,
    customerDetails,
    noteDetails,
    // Extract only the fields that exist in the invoices table
    customerId,
    customerName,
    dueDate,
    issueDate,
    invoiceNumber,
    logoUrl,
    vat,
    tax,
    discount,
    subtotal,
    topBlock,
    bottomBlock,
    amount,
    lineItems,
  } = params;

  const useToken = token ?? (await generateToken(id));

  // Remove paymentDetails and fromDetails from template since they're stored separately
  const { paymentDetails: _, fromDetails: __, ...restTemplate } = template;

  const [result] = await db
    .insert(invoices)
    .values({
      id,
      teamId,
      userId,
      token: useToken,
      // Only include fields that exist in the invoices table
      customerId,
      customerName,
      dueDate,
      issueDate,
      invoiceNumber,
      logoUrl,
      vat,
      tax,
      discount,
      subtotal,
      topBlock,
      bottomBlock,
      amount,
      lineItems,
      status: "draft",
      currency: template.currency?.toUpperCase() as any,
      // Store template data in the template JSON column
      template: restTemplate,
      // Store content fields
      paymentDetails: paymentDetails,
      fromDetails: fromDetails,
      customerDetails: customerDetails,
      noteDetails: noteDetails,
    })
    .onConflictDoUpdate({
      target: invoices.id,
      set: {
        teamId,
        userId,
        token: useToken,
        // Only include fields that exist in the invoices table
        customerId,
        customerName,
        dueDate,
        issueDate,
        invoiceNumber,
        logoUrl,
        vat,
        tax,
        discount,
        subtotal,
        topBlock,
        bottomBlock,
        amount,
        lineItems,
        status: "draft",
        currency: template.currency?.toUpperCase() as any,
        // Store template data in the template JSON column
        template: camelcaseKeys(restTemplate, { deep: true }),
        // Store content fields
        paymentDetails: paymentDetails,
        fromDetails: fromDetails,
        customerDetails: customerDetails,
        noteDetails: noteDetails,
      },
    })
    .returning();

  return result;
}

export type GetInvoiceSummaryParams = {
  teamId: string;
  status?: "paid" | "canceled" | "overdue" | "unpaid" | "draft";
};

export async function getInvoiceSummary(
  db: Database,
  params: GetInvoiceSummaryParams,
) {
  const { teamId, status } = params;

  try {
    const whereConditions: SQL[] = [eq(invoices.teamId, teamId)];

    if (status) {
      whereConditions.push(eq(invoices.status, status));
    }

    const result = await db
      .select({
        currency: invoices.currency,
        totalAmount: sql<number>`COALESCE(SUM(${invoices.amount}), 0)::float`,
        invoiceCount: sql<number>`COUNT(*)::int`,
      })
      .from(invoices)
      .where(and(...whereConditions))
      .groupBy(invoices.currency);

    // If no results, return an empty array instead of undefined
    return result || [];
  } catch (error) {
    console.error("Error in getInvoiceSummary:", error);
    // Return empty array on error to prevent frontend crashes
    return [];
  }
}

export type DeleteInvoiceParams = {
  id: string;
  teamId: string;
};

export async function deleteInvoice(db: Database, params: DeleteInvoiceParams) {
  const { id, teamId } = params;

  const [result] = await db
    .delete(invoices)
    .where(
      and(
        eq(invoices.id, id),
        eq(invoices.teamId, teamId),
        and(or(eq(invoices.status, "draft"), eq(invoices.status, "canceled"))),
      ),
    )
    .returning({
      id: invoices.id,
    });

  return result;
}

export type DuplicateInvoiceParams = {
  id: string;
  userId: string;
  invoiceNumber: string;
  teamId: string;
};

export async function duplicateInvoice(
  db: Database,
  params: DuplicateInvoiceParams,
) {
  const { id, userId, invoiceNumber, teamId } = params;

  // 1. Fetch the invoice that needs to be duplicated
  const [invoice] = await db
    .select({
      teamId: invoices.teamId,
      template: invoices.template,
      customerId: invoices.customerId,
      customerName: invoices.customerName,
      vat: invoices.vat,
      tax: invoices.tax,
      discount: invoices.discount,
      subtotal: invoices.subtotal,
      amount: invoices.amount,
      paymentDetails: invoices.paymentDetails,
      noteDetails: invoices.noteDetails,
      topBlock: invoices.topBlock,
      bottomBlock: invoices.bottomBlock,
      fromDetails: invoices.fromDetails,
      customerDetails: invoices.customerDetails,
      lineItems: invoices.lineItems,
    })
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.teamId, teamId)));

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const draftId = uuidv4();
  const token = await generateToken(draftId);

  const result = await draftInvoice(db, {
    id: draftId,
    token,
    userId,
    teamId: invoice.teamId,
    template: invoice.template as DraftInvoiceTemplateParams,
    dueDate: addMonths(new Date(), 1).toISOString(),
    issueDate: new Date().toISOString(),
    invoiceNumber,
    customerId: invoice.customerId,
    customerName: invoice.customerName,
    vat: invoice.vat,
    tax: invoice.tax,
    discount: invoice.discount,
    subtotal: invoice.subtotal,
    amount: invoice.amount,

    // @ts-expect-error - JSONB
    paymentDetails: invoice.paymentDetails,
    // @ts-expect-error - JSONB
    noteDetails: invoice.noteDetails,
    // @ts-expect-error - JSONB
    topBlock: invoice.topBlock,
    // @ts-expect-error - JSONB
    bottomBlock: invoice.bottomBlock,
    // @ts-expect-error - JSONB
    fromDetails: invoice.fromDetails,
    // @ts-expect-error - JSONB
    customerDetails: invoice.customerDetails,
    // @ts-expect-error - JSONB
    lineItems: invoice.lineItems,
  });

  logActivity({
    db,
    teamId,
    userId,
    type: "invoice_duplicated",
    metadata: {
      originalInvoiceId: id,
      newInvoiceId: result?.id,
      newInvoiceNumber: result?.invoiceNumber,
    },
  });

  return result;
}

export type UpdateInvoiceParams = {
  id: string;
  status?: "paid" | "canceled" | "unpaid" | "scheduled" | "draft";
  paidDate?: string | null;
  internalNote?: string | null;
  reminderSentAt?: string | null;
  scheduledAt?: string | null;
  scheduledJobId?: string | null;
  teamId: string;
  userId?: string;
};

export async function updateInvoice(db: Database, params: UpdateInvoiceParams) {
  const { id, teamId, userId, ...rest } = params;

  const [result] = await db
    .update(invoices)
    .set(rest)
    .where(and(eq(invoices.id, id), eq(invoices.teamId, teamId)))
    .returning();

  // Log activity if not draft
  if (rest.status !== "draft" && userId) {
    let priority: number | undefined = undefined;
    let activityType: (typeof activityTypeEnum.enumValues)[number] | null =
      null;

    if (rest.status === "paid") {
      activityType = "invoice_paid";
      priority = 3;
    } else if (rest.status === "canceled") {
      activityType = "invoice_cancelled";
      priority = 3;
    }

    if (activityType) {
      logActivity({
        db,
        teamId,
        userId,
        type: activityType,
        priority,
        metadata: {
          recordId: id,
          invoiceNumber: result?.invoiceNumber,
          customerName: result?.customerName,
          newStatus: rest.status,
          paidDate: rest.paidDate,
        },
      });
    }
  }

  return result;
}

export type GetMostActiveClientParams = {
  teamId: string;
};

export async function getMostActiveClient(
  db: Database,
  params: GetMostActiveClientParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      customerId: customers.id,
      customerName: customers.name,
      invoiceCount: sql<number>`COUNT(DISTINCT ${invoices.id})::int`,
    })
    .from(customers)
    .leftJoin(
      invoices,
      and(
        eq(invoices.customerId, customers.id),
        gte(invoices.createdAt, thirtyDaysAgo.toISOString()),
      ),
    )
    .where(eq(customers.teamId, teamId))
    .groupBy(customers.id, customers.name)
    .having(sql`COUNT(DISTINCT ${invoices.id}) > 0`)
    .orderBy(sql`COUNT(DISTINCT ${invoices.id}) DESC`)
    .limit(1);

  return result[0] || null;
}

export type GetInactiveClientsCountParams = {
  teamId: string;
};

export async function getInactiveClientsCount(
  db: Database,
  params: GetInactiveClientsCountParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Count customers with no recent invoices
  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(
      db
        .select({
          customerId: customers.id,
        })
        .from(customers)
        .leftJoin(
          invoices,
          and(
            eq(invoices.customerId, customers.id),
            gte(invoices.createdAt, thirtyDaysAgo.toISOString()),
          ),
        )
        .where(eq(customers.teamId, teamId))
        .groupBy(customers.id)
        .having(sql`COUNT(DISTINCT ${invoices.id}) = 0`)
        .as("inactive_customers"),
    );

  return result?.count || 0;
}

export type GetAverageDaysToPaymentParams = {
  teamId: string;
};

export async function getAverageDaysToPayment(
  db: Database,
  params: GetAverageDaysToPaymentParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [result] = await db
    .select({
      averageDays: sql<number>`ROUND(AVG(DATE_PART('day', ${invoices.paidDate}::timestamp - ${invoices.sentAt}::timestamp)))::int`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        eq(invoices.status, "paid"),
        isNotNull(invoices.paidDate),
        isNotNull(invoices.sentAt),
        gte(invoices.paidDate, thirtyDaysAgo.toISOString()),
      ),
    );

  return result?.averageDays || 0;
}

export type GetAverageInvoiceSizeParams = {
  teamId: string;
};

export async function getAverageInvoiceSize(
  db: Database,
  params: GetAverageInvoiceSizeParams,
) {
  const { teamId } = params;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .select({
      currency: invoices.currency,
      averageAmount: sql<number>`ROUND(AVG(${invoices.amount}), 2)::float`,
      invoiceCount: sql<number>`COUNT(*)::int`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.teamId, teamId),
        gte(invoices.sentAt, thirtyDaysAgo.toISOString()),
        isNotNull(invoices.sentAt),
      ),
    )
    .groupBy(invoices.currency);

  return result;
}
