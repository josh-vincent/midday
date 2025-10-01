import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

// Server-side loader for SSR compatibility
const invoiceFilterParamsSchema = {
  q: parseAsString,
  statuses: parseAsArrayOf(parseAsString),
  customers: parseAsArrayOf(parseAsString),
  start: parseAsString,
  end: parseAsString,
};

export const loadInvoiceFilterParams = createLoader(invoiceFilterParamsSchema);
