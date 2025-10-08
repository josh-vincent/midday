import { z } from "@hono/zod-openapi";

export const getCustomersSchema = z
  .object({
    q: z
      .string()
      .nullable()
      .optional()
      .openapi({
        description:
          "Search query string to filter customers by name, email, or other text fields",
        example: "acme",
        param: {
          in: "query",
        },
      }),
    sort: z
      .array(z.string(), z.string())
      .nullable()
      .optional()
      .openapi({
        description:
          "Sorting order as a tuple: [field, direction]. Example: ['name', 'asc'] or ['createdAt', 'desc']",
        example: ["name", "asc"],
        param: {
          in: "query",
        },
      }),
    cursor: z
      .string()
      .optional()
      .openapi({
        description:
          "Cursor for pagination, representing the last item from the previous page",
        example: "eyJpZCI6IjEyMyJ9",
        param: {
          in: "query",
        },
      }),
    pageSize: z.coerce
      .number()
      .min(1)
      .max(100)
      .optional()
      .openapi({
        description: "Number of customers to return per page (1-100)",
        example: 20,
        param: {
          in: "query",
        },
      }),
  })
  .openapi({
    description: "Query parameters for filtering and paginating customers",
    param: {
      in: "query",
    },
  });

export const customerResponseSchema = z.object({
  id: z.string().uuid().openapi({
    description: "Unique identifier of the customer",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
  name: z.string().openapi({
    description: "Name of the customer or organization",
    example: "Acme Corporation",
  }),
  email: z.string().email().nullable().openapi({
    description: "Primary email address of the customer",
    example: "contact@acme.com",
  }),
  billingEmail: z.string().email().nullable().openapi({
    description: "Billing email address of the customer",
    example: "billing@acme.com",
  }),
  phone: z.string().nullable().openapi({
    description: "Primary phone number of the customer",
    example: "+1-555-123-4567",
  }),
  website: z.string().nullable().openapi({
    description: "Website URL of the customer",
    example: "https://acme.com",
  }),
  contact: z.string().nullable().openapi({
    description: "Primary contact person's name at the customer organization",
    example: "John Smith",
  }),
  addressLine1: z.string().nullable().openapi({
    description: "First line of the customer's address",
    example: "123 Main Street",
  }),
  addressLine2: z.string().nullable().openapi({
    description: "Second line of the customer's address",
    example: "Suite 400",
  }),
  city: z.string().nullable().openapi({
    description: "City where the customer is located",
    example: "San Francisco",
  }),
  state: z.string().nullable().openapi({
    description: "State or province where the customer is located",
    example: "California",
  }),
  country: z.string().nullable().openapi({
    description: "Country name where the customer is located",
    example: "United States",
  }),
  countryCode: z.string().nullable().openapi({
    description: "ISO country code",
    example: "AU",
  }),
  postalCode: z.string().nullable().openapi({
    description: "ZIP or postal code of the customer's address",
    example: "94105",
  }),
  taxNumber: z.string().nullable().openapi({
    description: "Tax identification number of the customer",
    example: "US123456789",
  }),
  abn: z.string().nullable().openapi({
    description: "Australian Business Number",
    example: "12345678901",
  }),
  currency: z.string().nullable().openapi({
    description: "Preferred currency for the customer",
    example: "AUD",
  }),
  token: z.string().openapi({
    description: "Customer access token",
    example: "cust_token_abc123",
  }),
  note: z.string().nullable().openapi({
    description: "Internal notes about the customer for team reference",
    example: "Preferred contact method is email. Large enterprise client.",
  }),
  tags: z
    .any()
    .nullable()
    .openapi({
      description:
        "Array of tags associated with the customer for categorization",
      example: ["VIP", "Enterprise"],
    }),
  createdAt: z.string().openapi({
    description:
      "Date and time when the customer was created in ISO 8601 format",
    example: "2024-05-01T12:34:56.789Z",
  }),
  updatedAt: z.string().openapi({
    description:
      "Date and time when the customer was last updated in ISO 8601 format",
    example: "2024-05-01T12:34:56.789Z",
  }),
});

export const customersResponseSchema = z.object({
  meta: z
    .object({
      cursor: z.string().nullable().openapi({
        description:
          "Cursor for the next page of results, null if no more pages",
        example: "eyJpZCI6IjQ1NiJ9",
      }),
      hasPreviousPage: z.boolean().openapi({
        description:
          "Whether there are more customers available on the previous page",
        example: false,
      }),
      hasNextPage: z.boolean().openapi({
        description:
          "Whether there are more customers available on the next page",
        example: true,
      }),
    })
    .openapi({
      description: "Pagination metadata for the customers response",
    }),
  data: z.array(customerResponseSchema).openapi({
    description: "Array of customers matching the query criteria",
  }),
});

export const getCustomerByIdSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the customer to retrieve",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const deleteCustomerSchema = z.object({
  id: z.string().openapi({
    description: "Unique identifier of the customer to delete",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
    param: {
      in: "path",
      name: "id",
    },
  }),
});

export const upsertCustomerSchema = z.object({
  id: z.string().uuid().optional().openapi({
    description:
      "Unique identifier of the customer. Required for updates, omit for new customers",
    example: "b3b7c1e2-4c2a-4e7a-9c1a-2b7c1e24c2a4",
  }),
  name: z.string().openapi({
    description: "Name of the customer or organization",
    example: "Acme Corporation",
  }),
  email: z.string().email().nullable().optional().openapi({
    description: "Primary email address of the customer",
    example: "contact@acme.com",
  }),
  billingEmail: z.string().email().nullable().optional().openapi({
    description: "Billing email address of the customer",
    example: "billing@acme.com",
  }),
  phone: z.string().nullable().optional().openapi({
    description: "Primary phone number of the customer",
    example: "+1-555-123-4567",
  }),
  website: z.string().nullable().optional().openapi({
    description: "Website URL of the customer",
    example: "https://acme.com",
  }),
  contact: z.string().nullable().optional().openapi({
    description: "Primary contact person's name at the customer organization",
    example: "John Smith",
  }),
  addressLine1: z.string().nullable().optional().openapi({
    description: "First line of the customer's address",
    example: "123 Main Street",
  }),
  addressLine2: z.string().nullable().optional().openapi({
    description:
      "Second line of the customer's address (suite, apartment, etc.)",
    example: "Suite 400",
  }),
  city: z.string().nullable().optional().openapi({
    description: "City where the customer is located",
    example: "San Francisco",
  }),
  state: z.string().nullable().optional().openapi({
    description: "State or province where the customer is located",
    example: "California",
  }),
  country: z.string().nullable().optional().openapi({
    description: "Country name where the customer is located",
    example: "United States",
  }),
  countryCode: z.string().nullable().optional().openapi({
    description: "ISO country code",
    example: "AU",
  }),
  zip: z.string().nullable().optional().openapi({
    description: "ZIP or postal code of the customer's address",
    example: "94105",
  }),
  vatNumber: z.string().nullable().optional().openapi({
    description: "VAT (Value Added Tax) number of the customer",
    example: "US123456789",
  }),
  abn: z.string().nullable().optional().openapi({
    description: "Australian Business Number",
    example: "12345678901",
  }),
  currency: z.string().nullable().optional().openapi({
    description: "Preferred currency for the customer",
    example: "AUD",
  }),
  note: z.string().nullable().optional().openapi({
    description: "Internal notes about the customer for team reference",
    example: "Preferred contact method is email. Large enterprise client.",
  }),
  tags: z
    .any()
    .nullable()
    .optional()
    .openapi({
      description:
        "Array of tags to associate with the customer for categorization",
      example: ["VIP", "Enterprise"],
    }),
});
