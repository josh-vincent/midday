import type { Database } from "../client";
import { customers } from "../schema";
import { eq, and, ilike, sql, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export type CreateCustomerParams = {
  teamId: string;
  name: string;
  email?: string | null;
  billingEmail?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  taxNumber?: string | null;
  abn?: string | null;
  currency?: string | null;
  note?: string | null;
  tags?: any;
  contact?: string | null;
  token?: string;
};

export type UpdateCustomerParams = Partial<CreateCustomerParams> & {
  id: string;
  teamId: string;
};

export const createCustomer = async (
  db: Database,
  data: CreateCustomerParams,
) => {
  const id = uuidv4();
  const token = data.token || `cust_${uuidv4().replace(/-/g, "")}`;
  const [result] = await db
    .insert(customers)
    .values({
      id,
      ...data,
      token,
      updatedAt: new Date().toISOString(),
    })
    .returning();
  return result;
};

export const updateCustomer = async (
  db: Database,
  data: UpdateCustomerParams,
) => {
  const { id, teamId, ...updateData } = data;
  console.log("updateCustomer - data received:", JSON.stringify(data, null, 2));
  console.log(
    "updateCustomer - updateData to save:",
    JSON.stringify(updateData, null, 2),
  );

  const [result] = await db
    .update(customers)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(customers.id, id), eq(customers.teamId, teamId)))
    .returning();

  console.log(
    "updateCustomer - result from DB:",
    JSON.stringify(result, null, 2),
  );
  return result;
};

export type GetCustomerByIdParams = {
  id: string;
  teamId: string;
};

export const getCustomerById = async (
  db: Database,
  params: GetCustomerByIdParams,
) => {
  const { id, teamId } = params;
  const [result] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.teamId, teamId)));
  return result;
};

export const getCustomersByTeamId = async (db: Database, teamId: string) => {
  const results = await db
    .select()
    .from(customers)
    .where(eq(customers.teamId, teamId));
  return results;
};

export type DeleteCustomerParams = {
  id: string;
  teamId: string;
};

export const deleteCustomer = async (
  db: Database,
  params: DeleteCustomerParams,
) => {
  const { id, teamId } = params;
  const [result] = await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.teamId, teamId)))
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
  params: GetCustomersParams,
) => {
  const {
    teamId,
    limit = 50,
    offset = 0,
    search,
    sort = "name",
    order = "asc",
  } = params;

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
  const totalQuery = await db
    .select({ count: customers.id })
    .from(customers)
    .where(eq(customers.teamId, teamId));

  return {
    data: results,
    total: totalQuery.length,
  };
};
