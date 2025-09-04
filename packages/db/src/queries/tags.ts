import type { Database } from "../client";

// Stub implementations for tags (not used in invoicing MVP)
export async function getTags(db: Database, teamId: string) {
  return [];
}

export async function getTagById(db: Database, params: { id: string; teamId: string }) {
  return null;
}

export async function createTag(db: Database, params: any) {
  return null;
}

export async function updateTag(db: Database, params: any) {
  return null;
}

export async function deleteTag(db: Database, params: any) {
  return null;
}