import type { Database } from "../client";

export async function getApiKeysByTeam(db: Database, teamId: string) {
  return [];
}

export async function upsertApiKey(
  db: Database, 
  params: { teamId: string; userId: string; name: string; id?: string }
) {
  return { 
    data: null, 
    key: null, 
    keyHash: null 
  };
}

export async function deleteApiKey(
  db: Database,
  params: { teamId: string; id: string }
) {
  return null;
}

export async function validateAccessToken(
  db: Database,
  token: string
) {
  // Stub implementation - always return null (no valid token)
  return null;
}

export async function updateApiKeyLastUsedAt(
  db: Database,
  id: string
) {
  // Stub implementation
  return null;
}

export async function getApiKeyByToken(
  db: Database,
  token: string
) {
  // Stub implementation
  return null;
}