"use client";

import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
  type ParserBuilder,
} from "nuqs";
import { z } from "zod";

/**
 * Convert Zod type to nuqs parser
 */
function zodToNuqsParser(zodType: z.ZodTypeAny): ParserBuilder<any> {
  // Handle optional/nullable types
  if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
    return zodToNuqsParser(zodType.unwrap());
  }

  // String
  if (zodType instanceof z.ZodString) {
    return parseAsString;
  }

  // Enum
  if (zodType instanceof z.ZodEnum) {
    const values = zodType._def.values as string[];
    return parseAsStringEnum(values);
  }

  // Array
  if (zodType instanceof z.ZodArray) {
    const elementType = zodType._def.type;
    if (elementType instanceof z.ZodString) {
      return parseAsArrayOf(parseAsString);
    }
    if (elementType instanceof z.ZodEnum) {
      return parseAsArrayOf(parseAsString);
    }
  }

  // Date (as ISO string)
  if (zodType instanceof z.ZodDate) {
    return parseAsString;
  }

  // Default to string parser
  return parseAsString;
}

/**
 * Create a type-safe filter params hook from a Zod schema
 *
 * @example
 * const jobFilterSchema = z.object({
 *   q: z.string().optional(),
 *   status: z.enum(["pending", "completed"]).optional(),
 *   customerId: z.string().optional(),
 * });
 *
 * const useJobFilters = createFilterParamsHook(jobFilterSchema);
 *
 * // In component:
 * const { filter, setParams, hasFilters } = useJobFilters();
 */
export function createFilterParamsHook<T extends z.ZodObject<any>>(
  schema: T,
  options: { shallow?: boolean; excludeFromHasFilters?: string[] } = {},
) {
  // Convert Zod schema to nuqs parsers
  const parsers = Object.fromEntries(
    Object.entries(schema.shape).map(([key, zodType]) => {
      return [key, zodToNuqsParser(zodType as z.ZodTypeAny)];
    }),
  );

  return function useFilterParams() {
    const [params, setParams] = useQueryStates(parsers, {
      shallow: options.shallow ?? true,
    });

    const hasFilters = Object.entries(params)
      .filter(([key]) => {
        // Exclude certain keys from hasFilters check (e.g., groupBy)
        if (options.excludeFromHasFilters?.includes(key)) {
          return false;
        }
        return true;
      })
      .some(([, value]) => value !== null);

    return {
      filter: params as z.infer<T>,
      setParams,
      hasFilters,
    };
  };
}
