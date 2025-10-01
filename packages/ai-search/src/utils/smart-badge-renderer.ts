import type { BadgeRenderer } from "../types";

/**
 * Smart badge renderer that detects query type and shows contextual labels
 */
export const smartBadgeRenderer: BadgeRenderer = (key, value, context) => {
  switch (key) {
    case "q": {
      if (!value) return null;
      const queryValue = String(value);

      // Detect invoice number pattern
      const invoicePattern = /^(INV|invoice|#)/i;
      if (invoicePattern.test(queryValue)) {
        return `Invoice #: ${queryValue}`;
      }

      // Detect if it's purely numeric (amount search)
      const numericValue = queryValue.replace(/[,\s]/g, "");
      if (
        !Number.isNaN(Number(numericValue)) &&
        /^\d+(\.\d+)?$/.test(numericValue)
      ) {
        const amount = Number(numericValue);
        return `Amount: ${amount.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }

      // Return the query value directly without "Search:" prefix
      return queryValue;
    }

    case "status": {
      if (!value) return null;
      const status = context?.statusFilters?.find((f) => f.id === value);
      return status?.name || String(value);
    }

    case "statuses": {
      if (!value || !Array.isArray(value)) return null;
      return value
        .map((statusId) => {
          const status = context?.statusFilters?.find((f) => f.id === statusId);
          return status?.name || statusId;
        })
        .join(", ");
    }

    case "customerId": {
      if (!value) return null;
      const customer = context?.customers?.find((c) => c.id === value);
      return customer?.name || String(value);
    }

    case "customers": {
      if (!value || !Array.isArray(value)) return null;
      return value
        .map((id) => {
          const customer = context?.customers?.find((c) => c.id === id);
          return customer?.name || id;
        })
        .join(", ");
    }

    case "start": {
      if (!value) return null;
      // This is handled specially with end date
      return null;
    }

    case "end": {
      // Skip - handled with start
      return null;
    }

    default:
      return value ? String(value) : null;
  }
};

/**
 * Render date range badge
 */
export function renderDateRangeBadge(
  start: string | null,
  end: string | null,
): string | null {
  if (!start && !end) return null;

  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  }

  if (start) {
    return `From: ${new Date(start).toLocaleDateString()}`;
  }

  if (end) {
    return `Until: ${new Date(end).toLocaleDateString()}`;
  }

  return null;
}
