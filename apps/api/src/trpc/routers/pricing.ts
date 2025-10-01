import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import { z } from "zod";
import { 
  equipmentDefaults, 
  materialDefaults, 
  customerMaterialPricing, 
  teamSettings 
} from "@midday/db/schema";
import { eq, and } from "drizzle-orm";

export const pricingRouter = createTRPCRouter({
  // Get equipment defaults for a team
  getEquipmentDefaults: protectedProcedure
    .input(
      z.object({
        teamId: z.string().optional(),
      })
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const targetTeamId = input.teamId || teamId;
      if (!targetTeamId) return [];

      return await db
        .select()
        .from(equipmentDefaults)
        .where(
          and(
            eq(equipmentDefaults.teamId, targetTeamId),
            eq(equipmentDefaults.isActive, true)
          )
        );
    }),

  // Get material defaults for a team
  getMaterialDefaults: protectedProcedure
    .input(
      z.object({
        teamId: z.string().optional(),
      })
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const targetTeamId = input.teamId || teamId;
      if (!targetTeamId) return [];

      return await db
        .select()
        .from(materialDefaults)
        .where(
          and(
            eq(materialDefaults.teamId, targetTeamId),
            eq(materialDefaults.isActive, true)
          )
        );
    }),

  // Get customer-specific material pricing
  getCustomerMaterialPricing: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        materialType: z.string().optional(),
        teamId: z.string().optional(),
      })
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const targetTeamId = input.teamId || teamId;
      if (!targetTeamId) return [];

      const whereConditions = [
        eq(customerMaterialPricing.teamId, targetTeamId),
        eq(customerMaterialPricing.customerId, input.customerId),
        eq(customerMaterialPricing.isActive, true),
      ];

      if (input.materialType) {
        whereConditions.push(eq(customerMaterialPricing.materialType, input.materialType));
      }

      return await db
        .select()
        .from(customerMaterialPricing)
        .where(and(...whereConditions));
    }),

  // Get team settings
  getTeamSettings: protectedProcedure
    .input(
      z.object({
        teamId: z.string().optional(),
      })
    )
    .query(async ({ ctx: { db, teamId }, input }) => {
      const targetTeamId = input.teamId || teamId;
      if (!targetTeamId) return null;

      const [settings] = await db
        .select()
        .from(teamSettings)
        .where(eq(teamSettings.teamId, targetTeamId))
        .limit(1);

      return settings || null;
    }),

  // Create or update equipment default
  upsertEquipmentDefault: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        equipmentType: z.string(),
        defaultCapacity: z.number(),
        teamId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const targetTeamId = input.teamId || teamId;
      if (!targetTeamId) {
        throw new Error("Team ID is required");
      }

      if (input.id) {
        // Update existing
        const [updated] = await db
          .update(equipmentDefaults)
          .set({
            equipmentType: input.equipmentType,
            defaultCapacity: input.defaultCapacity.toString(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(equipmentDefaults.id, input.id),
              eq(equipmentDefaults.teamId, targetTeamId)
            )
          )
          .returning();

        return updated;
      } else {
        // Create new
        const [created] = await db
          .insert(equipmentDefaults)
          .values({
            teamId: targetTeamId,
            equipmentType: input.equipmentType,
            defaultCapacity: input.defaultCapacity.toString(),
          })
          .returning();

        return created;
      }
    }),

  // Create or update material default
  upsertMaterialDefault: protectedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        materialType: z.string(),
        defaultPrice: z.number(),
        currency: z.string().default("AUD"),
        teamId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      const targetTeamId = input.teamId || teamId;
      if (!targetTeamId) {
        throw new Error("Team ID is required");
      }

      if (input.id) {
        // Update existing
        const [updated] = await db
          .update(materialDefaults)
          .set({
            materialType: input.materialType,
            defaultPrice: input.defaultPrice.toString(),
            currency: input.currency,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(materialDefaults.id, input.id),
              eq(materialDefaults.teamId, targetTeamId)
            )
          )
          .returning();

        return updated;
      } else {
        // Create new
        const [created] = await db
          .insert(materialDefaults)
          .values({
            teamId: targetTeamId,
            materialType: input.materialType,
            defaultPrice: input.defaultPrice.toString(),
            currency: input.currency,
          })
          .returning();

        return created;
      }
    }),
});