import { upsertInvoiceTemplateSchema } from "@api/schemas/invoice";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import {
  createInvoiceTemplate,
  deleteInvoiceTemplate,
  ensureDefaultTemplate,
  getDefaultInvoiceTemplate,
  getInvoiceTemplate,
  getInvoiceTemplates,
  updateInvoiceTemplate,
} from "@midday/db/queries";
import { z } from "zod";

export const invoiceTemplateRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    // Ensure there's a default template, create if not exists
    const template = await ensureDefaultTemplate(db, teamId!);
    return template;
  }),

  isConfigured: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    const template = await ensureDefaultTemplate(db, teamId!);

    if (!template) {
      return { isConfigured: false, needsSetup: ['template'] };
    }

    // Helper function to check if a JSON field has meaningful content
    const hasValidJsonContent = (field: any): boolean => {
      if (!field) return false;

      let data: any;

      // Handle both string (JSON) and object (JSONB) formats
      if (typeof field === 'string') {
        if (field === '' || field === '{}' || field === 'null') return false;
        try {
          data = JSON.parse(field);
        } catch {
          return false;
        }
      } else if (typeof field === 'object') {
        data = field;
      } else {
        return false;
      }

      // Check if it's a TipTap document with actual content
      if (data.type === 'doc' && data.content && Array.isArray(data.content)) {
        // Check if there's any actual text content (not just empty paragraphs)
        const hasText = data.content.some((node: any) =>
          node.content && node.content.some((child: any) =>
            child.text && child.text.trim().length > 0
          )
        );
        return hasText;
      }

      return false;
    };

    const hasFromDetails = hasValidJsonContent(template.fromDetails);
    const hasPaymentDetails = hasValidJsonContent(template.paymentDetails);

    // Template is configured if it has both from details and payment details
    const isConfigured = hasFromDetails && hasPaymentDetails;

    return {
      isConfigured,
      needsSetup: isConfigured ? [] : ['company_details', 'payment_details'],
      template
    };
  }),

  upsert: protectedProcedure
    .input(upsertInvoiceTemplateSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      // First ensure we have a default template
      const template = await ensureDefaultTemplate(db, teamId!);

      // Update the default template with the new values
      return updateInvoiceTemplate(db, {
        ...input,
        id: template.id,
        teamId: teamId!,
        // These fields are already strings from the frontend (JSON stringified)
        fromDetails: input.fromDetails || template.fromDetails,
        paymentDetails: input.paymentDetails || template.paymentDetails,
        noteDetails: input.noteDetails || template.noteDetails,
      });
    }),

  // List all templates for team
  list: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    if (!teamId) return [];
    return getInvoiceTemplates(db, teamId);
  }),

  // Get single template
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) return null;
      return getInvoiceTemplate(db, input.id, teamId);
    }),

  // Create new template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Template name is required"),
        description: z.string().optional(),
        copyFromId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx: { db, teamId, userId }, input }) => {
      if (!teamId) throw new Error("Team ID is required");

      // If copying from existing template, get its data
      let templateData: any = {
        name: input.name,
        description: input.description,
      };

      if (input.copyFromId) {
        const sourceTemplate = await getInvoiceTemplate(
          db,
          input.copyFromId,
          teamId
        );
        if (sourceTemplate) {
          // Copy all template settings except id, name, description
          templateData = {
            ...templateData,
            logoUrl: sourceTemplate.logoUrl,
            includeQr: sourceTemplate.includeQr,
            currency: sourceTemplate.currency,
            dateFormat: sourceTemplate.dateFormat,
            includeTax: sourceTemplate.includeTax,
            taxRate: sourceTemplate.taxRate,
            includeVat: sourceTemplate.includeVat,
            vatRate: sourceTemplate.vatRate,
            includeDiscount: sourceTemplate.includeDiscount,
            includeDecimals: sourceTemplate.includeDecimals,
            size: sourceTemplate.size,
            fromDetails: sourceTemplate.fromDetails,
            paymentDetails: sourceTemplate.paymentDetails,
            noteDetails: sourceTemplate.noteDetails,
          };
        }
      }

      return createInvoiceTemplate(db, {
        ...templateData,
        teamId,
        createdBy: userId,
      });
    }),

  // Update template
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        title: z.string().optional(),
        fromDetails: z.string().optional(),
        paymentDetails: z.string().optional(),
        noteDetails: z.string().optional(),
        logoUrl: z.string().optional(),
        includeQr: z.boolean().optional(),
        currency: z.string().optional(),
        dateFormat: z.string().optional(),
        includeTax: z.boolean().optional(),
        taxRate: z.number().optional(),
        includeVat: z.boolean().optional(),
        vatRate: z.number().optional(),
        includeDiscount: z.boolean().optional(),
        includeDecimals: z.boolean().optional(),
        size: z.enum(["a4", "letter"]).optional(),
      })
    )
    .mutation(async ({ ctx: { db, teamId, userId }, input }) => {
      if (!teamId) throw new Error("Team ID is required");

      const { id, ...updateData } = input;
      return updateInvoiceTemplate(db, {
        ...updateData,
        id,
        teamId,
        updatedBy: userId,
      });
    }),

  // Delete template
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db, teamId, userId }, input }) => {
      if (!teamId) throw new Error("Team ID is required");

      // Don't allow deleting the default template
      const template = await getInvoiceTemplate(db, input.id, teamId);
      if (template?.isDefault) {
        throw new Error("Cannot delete the default template");
      }

      return deleteInvoiceTemplate(db, input.id, teamId, userId);
    }),

  // Set template as default
  setDefault: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db, teamId, userId }, input }) => {
      if (!teamId) throw new Error("Team ID is required");

      // First, unset all other defaults for this team
      const allTemplates = await getInvoiceTemplates(db, teamId);
      for (const template of allTemplates) {
        if (template.isDefault && template.id !== input.id) {
          await updateInvoiceTemplate(db, {
            id: template.id,
            teamId,
            isDefault: false,
            updatedBy: userId,
          });
        }
      }

      // Set the selected template as default
      return updateInvoiceTemplate(db, {
        id: input.id,
        teamId,
        isDefault: true,
        updatedBy: userId,
      });
    }),

  // Duplicate template
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx: { db, teamId, userId }, input }) => {
      if (!teamId) throw new Error("Team ID is required");

      const sourceTemplate = await getInvoiceTemplate(db, input.id, teamId);
      if (!sourceTemplate) {
        throw new Error("Template not found");
      }

      // Create a copy with " (Copy)" appended to name
      return createInvoiceTemplate(db, {
        teamId,
        name: `${sourceTemplate.name || "Template"} (Copy)`,
        description: sourceTemplate.description || undefined,
        logoUrl: sourceTemplate.logoUrl || undefined,
        includeQr: sourceTemplate.includeQr,
        currency: sourceTemplate.currency || undefined,
        dateFormat: sourceTemplate.dateFormat || undefined,
        includeTax: sourceTemplate.includeTax,
        taxRate: sourceTemplate.taxRate || undefined,
        includeVat: sourceTemplate.includeVat,
        vatRate: sourceTemplate.vatRate || undefined,
        includeDiscount: sourceTemplate.includeDiscount,
        includeDecimals: sourceTemplate.includeDecimals,
        size: sourceTemplate.size || undefined,
        fromDetails: sourceTemplate.fromDetails || undefined,
        paymentDetails: sourceTemplate.paymentDetails || undefined,
        noteDetails: sourceTemplate.noteDetails || undefined,
        createdBy: userId,
      });
    }),
});
