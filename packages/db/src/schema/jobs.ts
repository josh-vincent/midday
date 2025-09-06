import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
} from "drizzle-orm/pg-core";
import { customers } from "../schema";
import { teams } from "../schema";
import { invoices } from "../schema";

// Enum for job status
export const jobStatusEnum = pgEnum("job_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "invoiced",
]);

// Jobs table
export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobNumber: varchar("job_number", { length: 50 }).notNull().unique(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),

    // Job details
    contactPerson: varchar("contact_person", { length: 255 }),
    contactNumber: varchar("contact_number", { length: 50 }),
    rego: varchar("rego", { length: 20 }),
    loadNumber: integer("load_number"),
    companyName: varchar("company_name", { length: 255 }),
    addressSite: text("address_site"),

    // Material and equipment
    equipmentType: varchar("equipment_type", { length: 100 }),
    materialType: varchar("material_type", { length: 100 }),

    // Pricing
    pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }),
    cubicMetreCapacity: numeric("cubic_metre_capacity", {
      precision: 10,
      scale: 2,
    }),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),

    // Dates and status
    jobDate: date("job_date"),
    completedAt: timestamp("completed_at"),
    status: jobStatusEnum("status").default("pending").notNull(),

    // Invoice reference
    invoiceId: uuid("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }),
    invoiceLineItemId: uuid("invoice_line_item_id"),

    // Metadata
    notes: text("notes"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    createdBy: uuid("created_by"),
  },
  (table) => ({
    teamIdx: index("jobs_team_idx").on(table.teamId),
    customerIdx: index("jobs_customer_idx").on(table.customerId),
    statusIdx: index("jobs_status_idx").on(table.status),
    jobDateIdx: index("jobs_job_date_idx").on(table.jobDate),
    invoiceIdx: index("jobs_invoice_idx").on(table.invoiceId),
  }),
);

// Relations
export const jobsRelations = relations(jobs, ({ one }) => ({
  team: one(teams, {
    fields: [jobs.teamId],
    references: [teams.id],
  }),
  customer: one(customers, {
    fields: [jobs.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [jobs.invoiceId],
    references: [invoices.id],
  }),
}));
