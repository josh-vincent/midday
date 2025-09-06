import {
  deleteCustomerSchema,
  getCustomerByIdSchema,
  getCustomersSchema,
  upsertCustomerSchema,
} from "@api/schemas/customers";
import { createTRPCRouter, protectedProcedure } from "@api/trpc/init";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "@midday/db/queries";
import { z } from "zod";

export const customersRouter = createTRPCRouter({
  get: protectedProcedure
    .input(getCustomersSchema.optional())
    .query(async ({ ctx: { teamId, db }, input }) => {
      // Map API parameters to database query parameters
      const queryParams = {
        teamId: teamId!,
        limit: input?.pageSize,
        search: input?.q,
        sort: input?.sort?.[0],
        order: input?.sort?.[1] as "asc" | "desc" | undefined,
      };

      const result = await getCustomers(db, queryParams);

      // Database fields now match API fields, minimal mapping needed
      const mappedData = result.data.map((customer) => {
        return {
          ...customer,
          zip: customer.postalCode, // Keep backward compatibility
          vatNumber: customer.taxNumber, // Keep backward compatibility
        };
      });

      return {
        ...result,
        data: mappedData,
      };
    }),

  getById: protectedProcedure
    .input(getCustomerByIdSchema)
    .query(async ({ ctx: { db, teamId }, input }) => {
      const customer = await getCustomerById(db, {
        id: input.id,
        teamId: teamId!,
      });

      if (!customer) {
        return null;
      }

      // Database fields now match API fields, minimal mapping needed
      return {
        ...customer,
        zip: customer.postalCode, // Keep backward compatibility
        vatNumber: customer.taxNumber, // Keep backward compatibility
      };
    }),

  delete: protectedProcedure
    .input(deleteCustomerSchema)
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      return deleteCustomer(db, {
        id: input.id,
        teamId: teamId!,
      });
    }),

  upsert: protectedProcedure
    .input(upsertCustomerSchema)
    .mutation(async ({ ctx: { db, teamId, session }, input }) => {
      // Map API field names to database field names
      const mappedInput = {
        name: input.name,
        email: input.email,
        billingEmail: input.billingEmail,
        phone: input.phone,
        website: input.website,
        contact: input.contact,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2,
        city: input.city,
        state: input.state,
        country: input.country,
        countryCode: input.countryCode,
        postalCode: input.zip, // Map 'zip' from form to 'postalCode' in DB
        taxNumber: input.vatNumber, // Map 'vatNumber' from form to 'taxNumber' in DB
        abn: input.abn,
        currency: input.currency,
        note: input.note,
        tags: input.tags,
        teamId: teamId!,
      };

      // Remove undefined values only, keep nulls as they are valid
      Object.keys(mappedInput).forEach((key) => {
        if (mappedInput[key as keyof typeof mappedInput] === undefined) {
          delete mappedInput[key as keyof typeof mappedInput];
        }
      });

      console.log(
        "Customer upsert input:",
        JSON.stringify(mappedInput, null, 2),
      );

      let result;
      if (input.id) {
        result = await updateCustomer(db, {
          id: input.id,
          ...mappedInput,
        });
      } else {
        result = await createCustomer(db, mappedInput);
      }

      console.log("Customer upsert result:", JSON.stringify(result, null, 2));

      // Map the response back for backward compatibility
      if (result) {
        return {
          ...result,
          zip: result.postalCode,
          vatNumber: result.taxNumber,
        };
      }

      return result;
    }),

  // Bulk import customers from CSV
  bulkImport: protectedProcedure
    .input(
      z.object({
        customers: z.array(
          z.object({
            name: z.string(),
            email: z.string().email().optional().nullable(),
            phone: z.string().optional().nullable(),
            website: z.string().optional().nullable(),
            address: z.string().optional().nullable(),
            city: z.string().optional().nullable(),
            state: z.string().optional().nullable(),
            postalCode: z.string().optional().nullable(),
            country: z.string().optional().nullable(),
            contactPerson: z.string().optional().nullable(),
            abn: z.string().optional().nullable(),
            notes: z.string().optional().nullable(),
            status: z.enum(["active", "inactive"]).default("active"),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx: { db, teamId }, input }) => {
      if (!teamId) {
        throw new Error("No team selected");
      }

      const results = [];
      for (const customer of input.customers) {
        try {
          const result = await createCustomer(db, {
            teamId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            website: customer.website,
            addressLine1: customer.address,
            city: customer.city,
            state: customer.state,
            postalCode: customer.postalCode,
            country: customer.country || "Australia",
            contact: customer.contactPerson,
            taxNumber: customer.abn,
            note: customer.notes,
          });
          results.push(result);
        } catch (error) {
          console.error("Failed to import customer:", customer.name, error);
          // Continue with other customers even if one fails
        }
      }

      return results;
    }),
});
