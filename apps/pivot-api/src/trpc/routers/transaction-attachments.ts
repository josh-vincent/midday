import {
  createAttachmentsSchema,
  deleteAttachmentSchema,
  processTransactionAttachmentSchema,
} from "@api/schemas/transaction-attachments";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { createAttachments, deleteAttachment } from "@midday/db/queries";

// Allowed MIME types for attachments (copied from @midday/documents)
const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

export const transactionAttachmentsRouter = createTRPCRouter({
  createMany: protectedProcedure
    .input(createAttachmentsSchema)
    .mutation(async ({ input, ctx: { db, teamId, session } }) => {
      return createAttachments(db, {
        teamId: teamId!,
        userId: session.user.id,
        attachments: input,
      });
    }),

  delete: protectedProcedure
    .input(deleteAttachmentSchema)
    .mutation(async ({ input, ctx: { db, teamId } }) => {
      return deleteAttachment(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  processAttachment: protectedProcedure
    .input(processTransactionAttachmentSchema)
    .mutation(async ({ input, ctx: { teamId } }) => {
      const allowedAttachments = input.filter((item) =>
        allowedMimeTypes.includes(item.mimetype),
      );

      if (allowedAttachments.length === 0) {
        return;
      }

      // Note: Trigger.dev processing disabled for Pivot
      return [];
    }),
});
