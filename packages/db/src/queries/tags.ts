import type { Database } from "../client";
import { tags } from "../schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export type CreateTagParams = {
  teamId: string;
  name: string;
  color?: string | null;
};

export type UpdateTagParams = {
  id: string;
  teamId: string;
  name?: string;
  color?: string | null;
};

export const createTag = async (db: Database, data: CreateTagParams) => {
  const id = uuidv4();
  const [result] = await db
    .insert(tags)
    .values({
      id,
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .returning();
  return result;
};

export const updateTag = async (db: Database, data: UpdateTagParams) => {
  const { id, teamId, ...updateData } = data;
  const [result] = await db
    .update(tags)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(tags.id, id), eq(tags.teamId, teamId)))
    .returning();
  return result;
};

export const deleteTag = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const { id, teamId } = params;
  const [result] = await db
    .delete(tags)
    .where(and(eq(tags.id, id), eq(tags.teamId, teamId)))
    .returning();
  return result;
};

export const getTags = async (db: Database, teamId: string) => {
  const results = await db
    .select()
    .from(tags)
    .where(eq(tags.teamId, teamId))
    .orderBy(tags.name);
  return results;
};

export const getTagsByTeamId = async (db: Database, teamId: string) => {
  const results = await db
    .select()
    .from(tags)
    .where(eq(tags.teamId, teamId))
    .orderBy(tags.name);
  return results;
};

export const getTagById = async (
  db: Database,
  params: { id: string; teamId: string },
) => {
  const { id, teamId } = params;
  const [result] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, id), eq(tags.teamId, teamId)));
  return result;
};
