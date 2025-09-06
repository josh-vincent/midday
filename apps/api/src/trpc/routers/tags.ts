import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createTag,
  deleteTag,
  getTagById,
  getTagsByTeamId,
  updateTag,
} from "@midday/db/queries";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
});

const updateTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Tag name is required"),
  color: z.string().optional(),
});

const deleteTagSchema = z.object({
  id: z.string().uuid(),
});

const getTagByIdSchema = z.object({
  id: z.string().uuid(),
});

export const tagsRouter = createTRPCRouter({
  get: protectedProcedure.query(async ({ ctx: { teamId, db } }) => {
    return getTagsByTeamId(db, teamId!);
  }),

  getById: protectedProcedure
    .input(getTagByIdSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      return getTagById(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  create: protectedProcedure
    .input(createTagSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return createTag(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  update: protectedProcedure
    .input(updateTagSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return updateTag(db, {
        ...input,
        teamId: teamId!,
      });
    }),

  delete: protectedProcedure
    .input(deleteTagSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteTag(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),
});
