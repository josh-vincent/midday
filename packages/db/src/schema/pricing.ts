import { relations } from "drizzle-orm";
import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";
import { teams, customers } from "../schema";

// Equipment capacity defaults table
export const equipmentDefaults = pgTable(
  "equipment_defaults",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    equipmentType: varchar("equipment_type", { length: 100 }).notNull(),
    defaultCapacity: numeric("default_capacity", { precision: 10, scale: 2 }).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    teamEquipmentIdx: index("equipment_defaults_team_equipment_idx").on(
      table.teamId,
      table.equipmentType
    ),
  })
);

// Material pricing defaults table
export const materialDefaults = pgTable(
  "material_defaults",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    materialType: varchar("material_type", { length: 100 }).notNull(),
    defaultPrice: numeric("default_price", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("AUD").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    teamMaterialIdx: index("material_defaults_team_material_idx").on(
      table.teamId,
      table.materialType
    ),
  })
);

// Customer-specific material pricing overrides
export const customerMaterialPricing = pgTable(
  "customer_material_pricing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    materialType: varchar("material_type", { length: 100 }).notNull(),
    customPrice: numeric("custom_price", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("AUD").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    notes: text("notes"),
    effectiveFrom: timestamp("effective_from").defaultNow().notNull(),
    effectiveTo: timestamp("effective_to"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    customerMaterialIdx: index("customer_material_pricing_customer_material_idx").on(
      table.customerId,
      table.materialType
    ),
    teamCustomerIdx: index("customer_material_pricing_team_customer_idx").on(
      table.teamId,
      table.customerId
    ),
  })
);

// Team settings for default configurations
export const teamSettings = pgTable(
  "team_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" })
      .unique(),
    defaultCurrency: varchar("default_currency", { length: 3 }).default("AUD").notNull(),
    autoCalculatePricing: boolean("auto_calculate_pricing").default(true).notNull(),
    autoFillCapacity: boolean("auto_fill_capacity").default(true).notNull(),
    defaultJobStatus: varchar("default_job_status", { length: 20 }).default("delivered").notNull(),
    businessHoursStart: varchar("business_hours_start", { length: 5 }).default("07:00").notNull(),
    businessHoursEnd: varchar("business_hours_end", { length: 5 }).default("17:00").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    teamIdx: index("team_settings_team_idx").on(table.teamId),
  })
);

// Relations
export const equipmentDefaultsRelations = relations(equipmentDefaults, ({ one }) => ({
  team: one(teams, {
    fields: [equipmentDefaults.teamId],
    references: [teams.id],
  }),
}));

export const materialDefaultsRelations = relations(materialDefaults, ({ one }) => ({
  team: one(teams, {
    fields: [materialDefaults.teamId],
    references: [teams.id],
  }),
}));

export const customerMaterialPricingRelations = relations(
  customerMaterialPricing,
  ({ one }) => ({
    team: one(teams, {
      fields: [customerMaterialPricing.teamId],
      references: [teams.id],
    }),
    customer: one(customers, {
      fields: [customerMaterialPricing.customerId],
      references: [customers.id],
    }),
  })
);

export const teamSettingsRelations = relations(teamSettings, ({ one }) => ({
  team: one(teams, {
    fields: [teamSettings.teamId],
    references: [teams.id],
  }),
}));