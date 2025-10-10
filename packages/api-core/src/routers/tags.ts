import { tagSchemaForTRPC } from "@midday/api-schemas/tags";
import {
  createTag,
  deleteTag,
  getTagById,
  getTagsByTeamId,
  updateTag,
} from "@midday/db/queries";
import type { TRPCRouterFactory } from "../types";

/**
 * Creates a tags router with CRUD operations
 * This is a factory function that accepts the router factory dependencies
 */
export const createTagsRouter: TRPCRouterFactory = ({
  createTRPCRouter,
  protectedProcedure,
}) => {
  return createTRPCRouter({
    get: protectedProcedure.query(async ({ ctx: { teamId, db } }) => {
      return getTagsByTeamId(db, teamId!);
    }),

    getById: protectedProcedure
      .input(tagSchemaForTRPC.getById)
      .query(async ({ ctx: { db, teamId }, input }) => {
        return getTagById(db, {
          id: input.id,
          teamId: teamId!,
        });
      }),

    create: protectedProcedure
      .input(tagSchemaForTRPC.create)
      .mutation(async ({ ctx: { db, teamId }, input }) => {
        return createTag(db, {
          ...input,
          teamId: teamId!,
        });
      }),

    update: protectedProcedure
      .input(tagSchemaForTRPC.update)
      .mutation(async ({ ctx: { db, teamId }, input }) => {
        return updateTag(db, {
          ...input,
          teamId: teamId!,
        });
      }),

    delete: protectedProcedure
      .input(tagSchemaForTRPC.delete)
      .mutation(async ({ ctx: { db, teamId }, input }) => {
        return deleteTag(db, {
          id: input.id,
          teamId: teamId!,
        });
      }),
  });
};
