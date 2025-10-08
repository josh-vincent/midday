"use client";

import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useJobParams() {
  const [params, setParams] = useQueryStates({
    jobId: parseAsString,
    createJob: parseAsBoolean,
    customerId: parseAsString,
  });

  return {
    params,
    setParams,
  };
}
