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
