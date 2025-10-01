import { createFilterParamsHook } from "@midday/ai-search";
import { invoiceFilterSchema } from "@/config/invoice-filters";

/**
 * Type-safe hook for invoice filter URL parameters
 * Automatically syncs with URL using nuqs
 */
export const useInvoiceFilterParams = createFilterParamsHook(invoiceFilterSchema, {
  shallow: true,
});
