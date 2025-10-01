import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

// Server-side loader for customer filter parameters
const customerFilterParamsSchema = {
  q: parseAsString,
  sort: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
};

export const loadCustomerFilterParams = createLoader(
  customerFilterParamsSchema,
);
