"use client";

import { parseAsString, useQueryStates } from "nuqs";

const searchParamsCache = {
  status: parseAsString,
  q: parseAsString,
  customerId: parseAsString,
  start: parseAsString,
  end: parseAsString,
};

export function useJobFilterParams() {
  const [params, setParams] = useQueryStates(searchParamsCache, {
    shallow: false,
  });

  const hasFilters = Object.values(params).some((value) => value !== null);

  return {
    filter: {
      status: params.status,
      q: params.q,
      customerId: params.customerId,
      start: params.start,
      end: params.end,
    },
    setParams,
    hasFilters,
  };
}