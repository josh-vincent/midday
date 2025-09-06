import type { Database } from "../client";

export async function getBankAccounts(
  db: Database,
  params: { teamId: string; [key: string]: any },
) {
  return [];
}

export async function getBankAccountById(
  db: Database,
  params: { id: string; teamId: string },
) {
  return null;
}

export async function createBankAccount(
  db: Database,
  params: { teamId: string; userId: string; [key: string]: any },
) {
  return null;
}

export async function updateBankAccount(
  db: Database,
  params: { id: string; teamId: string; [key: string]: any },
) {
  return null;
}

export async function deleteBankAccount(
  db: Database,
  params: { id: string; teamId: string },
) {
  return null;
}
