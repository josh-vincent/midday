import type { Database } from "../client";

// Stub implementations for tracker projects (not used in invoicing)
export async function getTrackerProjects(db: Database, params: any) {
  return [];
}

export async function getTrackerProjectById(db: Database, params: any) {
  return null;
}

export async function createTrackerProject(db: Database, params: any) {
  return null;
}

export async function updateTrackerProject(db: Database, params: any) {
  return null;
}

export async function deleteTrackerProject(db: Database, params: any) {
  return null;
}
