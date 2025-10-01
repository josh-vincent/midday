import type { Database } from "@db/client";
import { invoiceProducts } from "@db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

export type InvoiceProduct = {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  teamId: string;
  createdBy: string | null;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  unit: string | null;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: string | null;
};

export type CreateInvoiceProductParams = {
  teamId: string;
  createdBy: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  isActive?: boolean;
};

export type UpdateInvoiceProductParams = {
  id: string;
  teamId: string;
  name?: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
  isActive?: boolean;
  usageCount?: number;
  lastUsedAt?: string | null;
};

export type SearchInvoiceProductsParams = {
  teamId: string;
  query: string;
  limit?: number;
};

export async function createInvoiceProduct(
  db: Database,
  params: CreateInvoiceProductParams,
): Promise<InvoiceProduct> {
  const [result] = await db
    .insert(invoiceProducts)
    .values({
      ...params,
      lastUsedAt: new Date().toISOString(),
    })
    .returning();

  if (!result) {
    throw new Error("Failed to create invoice product");
  }

  return result;
}

export type UpsertInvoiceProductParams = {
  teamId: string;
  createdBy: string;
  name: string;
  description?: string | null;
  price?: number | null;
  currency?: string | null;
  unit?: string | null;
};

export async function upsertInvoiceProduct(
  db: Database,
  params: UpsertInvoiceProductParams,
): Promise<InvoiceProduct> {
  const now = new Date().toISOString();

  const [result] = await db
    .insert(invoiceProducts)
    .values({
      ...params,
      usageCount: 1,
      lastUsedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        invoiceProducts.teamId,
        invoiceProducts.name,
        invoiceProducts.currency,
        invoiceProducts.price,
      ],
      set: {
        // Update product details with latest information (only if provided)
        ...(params.description !== undefined && {
          description: params.description,
        }),
        ...(params.unit !== undefined && { unit: params.unit }),
        usageCount: sql`${invoiceProducts.usageCount} + 1`,
        lastUsedAt: now,
        updatedAt: now,
        // Keep original createdBy, don't overwrite
      },
    })
    .returning();

  if (!result) {
    throw new Error("Failed to upsert invoice product");
  }

  return result;
}

export async function updateInvoiceProduct(
  db: Database,
  params: UpdateInvoiceProductParams,
): Promise<InvoiceProduct | null> {
  const { id, teamId, ...updateData } = params;

  const [result] = await db
    .update(invoiceProducts)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(invoiceProducts.id, id), eq(invoiceProducts.teamId, teamId)))
    .returning();

  return result || null;
}

export async function getInvoiceProductById(
  db: Database,
  id: string,
  teamId: string,
): Promise<InvoiceProduct | null> {
  const [result] = await db
    .select()
    .from(invoiceProducts)
    .where(and(eq(invoiceProducts.id, id), eq(invoiceProducts.teamId, teamId)))
    .limit(1);

  return result || null;
}

export async function searchInvoiceProducts(
  db: Database,
  params: SearchInvoiceProductsParams,
): Promise<InvoiceProduct[]> {
  const { teamId, query, limit = 10 } = params;

  return await db
    .select()
    .from(invoiceProducts)
    .where(
      and(
        eq(invoiceProducts.teamId, teamId),
        eq(invoiceProducts.isActive, true),
        or(
          // Full-text search for better matching
          sql`${invoiceProducts.fts} @@ plainto_tsquery('english', ${query})`,
          // Partial name match for shorter queries
          ilike(invoiceProducts.name, `%${query}%`),
        ),
      ),
    )
    .orderBy(
      // Order by relevance, then usage frequency, then recency
      desc(
        sql`ts_rank(${invoiceProducts.fts}, plainto_tsquery('english', ${query}))`,
      ),
      desc(invoiceProducts.usageCount),
      desc(invoiceProducts.lastUsedAt),
    )
    .limit(limit);
}

export async function incrementProductUsage(
  db: Database,
  id: string,
  teamId: string,
): Promise<void> {
  await db
    .update(invoiceProducts)
    .set({
      usageCount: sql`${invoiceProducts.usageCount} + 1`,
      lastUsedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(invoiceProducts.id, id), eq(invoiceProducts.teamId, teamId)));
}

export async function getTopInvoiceProducts(
  db: Database,
  teamId: string,
  limit = 10,
): Promise<InvoiceProduct[]> {
  return await db
    .select()
    .from(invoiceProducts)
    .where(and(eq(invoiceProducts.teamId, teamId), eq(invoiceProducts.isActive, true)))
    .orderBy(desc(invoiceProducts.usageCount), desc(invoiceProducts.lastUsedAt))
    .limit(limit);
}

export async function deleteInvoiceProduct(
  db: Database,
  id: string,
  teamId: string,
): Promise<void> {
  await db
    .delete(invoiceProducts)
    .where(and(eq(invoiceProducts.id, id), eq(invoiceProducts.teamId, teamId)));
}