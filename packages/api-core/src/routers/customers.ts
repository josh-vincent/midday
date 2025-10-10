import { customerSchemaForTRPC } from "@midday/api-schemas/customer";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "@midday/db/queries";
import type { TRPCRouterFactory } from "../types";

/**
 * Creates a customers router with CRUD operations
 * This is a factory function that accepts the router factory dependencies
 */
export const createCustomersRouter: TRPCRouterFactory = ({
  createTRPCRouter,
  protectedProcedure,
}) => {
  return createTRPCRouter({
    get: protectedProcedure
      .input(customerSchemaForTRPC.get)
      .query(async ({ ctx: { teamId, db }, input }) => {
        // Map API parameters to database query parameters
        const queryParams = {
          teamId: teamId!,
          limit: input?.pageSize,
          search: input?.q ?? undefined,
          sort: input?.sort?.[0],
          order: input?.sort?.[1] as "asc" | "desc" | undefined,
        };

        const result = await getCustomers(db, queryParams);

        // Database fields now match API fields, minimal mapping needed
        const mappedData = result.data.map(
          (customer: (typeof result.data)[number]) => {
            return {
              ...customer,
              zip: customer.postalCode, // Keep backward compatibility
              vatNumber: customer.taxNumber, // Keep backward compatibility
            };
          },
        );

        return {
          ...result,
          data: mappedData,
        };
      }),

    getById: protectedProcedure
      .input(customerSchemaForTRPC.getById)
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
      .input(customerSchemaForTRPC.delete)
      .mutation(async ({ ctx: { db, teamId }, input }) => {
        return deleteCustomer(db, {
          id: input.id,
          teamId: teamId!,
        });
      }),

    upsert: protectedProcedure
      .input(customerSchemaForTRPC.upsert)
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
        for (const key of Object.keys(mappedInput)) {
          if (mappedInput[key as keyof typeof mappedInput] === undefined) {
            delete mappedInput[key as keyof typeof mappedInput];
          }
        }

        let result: any;
        if (input.id) {
          result = await updateCustomer(db, {
            id: input.id,
            ...mappedInput,
          });
        } else {
          result = await createCustomer(db, mappedInput);
        }

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
      .input(customerSchemaForTRPC.bulkImport)
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
};
