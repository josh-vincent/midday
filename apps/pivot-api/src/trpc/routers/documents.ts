import { getDocumentsSchema } from "@api/schemas/documents";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { getDocuments } from "@midday/db/queries";

export const documentsRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getDocumentsSchema)
    .query(async ({ input, ctx: { db, teamId } }) => {
      const { pageSize, cursor, ...filter } = input;

      const result = await getDocuments(db, {
        teamId: teamId!,
        pageSize: pageSize || 10,
        cursor: cursor || undefined,
        ...filter,
      });

      return result;
    }),
});
