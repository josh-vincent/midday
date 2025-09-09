import { upsertInvoiceTemplateSchema } from "@api/schemas/invoice";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { parseInputValue } from "@api/utils/parse";
import {
  ensureDefaultTemplate,
  getDefaultInvoiceTemplate,
  updateInvoiceTemplate,
} from "@midday/db/queries";

export const invoiceTemplateRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    // Ensure there's a default template, create if not exists
    const template = await ensureDefaultTemplate(db, teamId!);
    return template;
  }),

  isConfigured: protectedProcedure.query(async ({ ctx: { db, teamId } }) => {
    const template = await getDefaultInvoiceTemplate(db, teamId!);
    
    if (!template) {
      return { isConfigured: false, needsSetup: ['template'] };
    }

    const needsSetup: string[] = [];
    
    // Check if essential fields are configured
    if (!template.fromDetails || template.fromDetails === '{}' || template.fromDetails === '' || template.fromDetails === 'null') {
      needsSetup.push('company_details');
    }
    
    if (!template.paymentDetails || template.paymentDetails === '{}' || template.paymentDetails === '' || template.paymentDetails === 'null') {
      needsSetup.push('payment_details');
    }
    
    // Check if it's still the basic auto-generated template that needs customization
    const isBasicTemplate = template.name === "Default Template" && 
                           template.description === "Standard invoice template" &&
                           (!template.fromDetails || template.fromDetails === '{}' || template.fromDetails === '' || template.fromDetails === 'null') &&
                           (!template.paymentDetails || template.paymentDetails === '{}' || template.paymentDetails === '' || template.paymentDetails === 'null');
    
    if (isBasicTemplate) {
      needsSetup.push('template_customization');
    }

    return {
      isConfigured: needsSetup.length === 0,
      needsSetup,
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
});
