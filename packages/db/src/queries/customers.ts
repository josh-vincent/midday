import type { Database } from "../client";
import { customers } from "../schema";
import { eq } from "drizzle-orm";

export type CreateCustomerParams = {
  id: string;
  teamId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  taxNumber?: string | null;
  note?: string | null;
};

export type UpdateCustomerParams = Partial<CreateCustomerParams> & {
  id: string;
};

export const createCustomer = async (
  db: Database,
  data: CreateCustomerParams
) => {
  const [result] = await db.insert(customers).values(data).returning();
  return result;
};

export const updateCustomer = async (
  db: Database,
  data: UpdateCustomerParams
) => {
  const { id, ...updateData } = data;
  const [result] = await db
    .update(customers)
    .set(updateData)
    .where(eq(customers.id, id))
    .returning();
  return result;
};

export const getCustomerById = async (db: Database, id: string) => {
  const [result] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));
  return result;
};

export const getCustomersByTeamId = async (db: Database, teamId: string) => {
  const results = await db
    .select()
    .from(customers)
    .where(eq(customers.teamId, teamId));
  return results;
};

export const deleteCustomer = async (db: Database, id: string) => {
  const [result] = await db
    .delete(customers)
    .where(eq(customers.id, id))
    .returning();
  return result;
};

export type GetCustomersParams = {
  teamId: string;
  limit?: number;
  offset?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
};

export const getCustomers = async (
  db: Database,
  params: GetCustomersParams
) => {
  const { teamId, limit = 50, offset = 0, search, sort = "name", order = "asc" } = params;
  
  let query = db.select().from(customers).where(eq(customers.teamId, teamId));
  
  // Add sorting
  if (sort && order) {
    const column = customers[sort as keyof typeof customers];
    if (column) {
      query = query.orderBy(order === "asc" ? column : column);
    }
  }
  
  // Add pagination
  query = query.limit(limit).offset(offset);
  
  const results = await query;
  const totalQuery = await db.select({ count: customers.id }).from(customers).where(eq(customers.teamId, teamId));
  
  return {
    data: results,
    total: totalQuery.length,
  };
};