import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createInvoiceProduct,
  deleteInvoiceProduct,
  getInvoiceProductById,
  getTopInvoiceProducts,
  searchInvoiceProducts,
  updateInvoiceProduct,
  upsertInvoiceProduct,
} from "@midday/db/queries";
import { z } from "zod";

const createInvoiceProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateInvoiceProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

const upsertInvoiceProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
});

const searchInvoiceProductsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).optional().default(10),
});

const getProductByIdSchema = z.object({
  id: z.string().uuid(),
});

const deleteProductSchema = z.object({
  id: z.string().uuid(),
});

const getTopProductsSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(10),
});

export const invoiceProductsRouter = createTRPCRouter({
  // Search products with full-text search
  search: protectedProcedure
    .input(searchInvoiceProductsSchema)
    .query(async ({ ctx: { db, teamId, session }, input }) => {
      if (!teamId) {
        return [];
      }

      return await searchInvoiceProducts(db, {
        teamId,
        query: input.query,
        limit: input.limit,
      });
    }),

  // Get top/most used products
  getTop: protectedProcedure
    .input(getTopProductsSchema.optional())
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return [];
      }

      return await getTopInvoiceProducts(db, teamId, input?.limit ?? 10);
    }),

  // Get product by ID
  getById: protectedProcedure
    .input(getProductByIdSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        return null;
      }

      return await getInvoiceProductById(db, input.id, teamId);
    }),

  // Create new product
  create: protectedProcedure
    .input(createInvoiceProductSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      if (!teamId || !session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return await createInvoiceProduct(db, {
        teamId,
        createdBy: session.user.id,
        ...input,
      });
    }),

  // Upsert product (create or update usage)
  upsert: protectedProcedure
    .input(upsertInvoiceProductSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      if (!teamId || !session?.user?.id) {
        throw new Error("Unauthorized");
      }

      return await upsertInvoiceProduct(db, {
        teamId,
        createdBy: session.user.id,
        ...input,
      });
    }),

  // Update existing product
  update: protectedProcedure
    .input(updateInvoiceProductSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new Error("Unauthorized");
      }

      return await updateInvoiceProduct(db, {
        teamId,
        ...input,
      });
    }),

  // Delete product
  delete: protectedProcedure
    .input(deleteProductSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new Error("Unauthorized");
      }

      await deleteInvoiceProduct(db, input.id, teamId);
      return { success: true };
    }),
});