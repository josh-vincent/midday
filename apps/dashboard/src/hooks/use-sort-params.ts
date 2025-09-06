'use client'
import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";

export const sortParamsSchema = {
  sort: parseAsArrayOf(parseAsString),
};

export function useSortParams() {
  const [params, setParams] = useQueryStates(sortParamsSchema);

  return { params, setParams };
}
