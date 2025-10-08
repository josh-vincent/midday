import { parseAsBoolean, parseAsString, useQueryStates } from "nuqs";

export function useCustomerParams() {
  const [params, setParams] = useQueryStates({
    customerId: parseAsString,
    createCustomer: parseAsBoolean,
    name: parseAsString,
    q: parseAsString,
    jobId: parseAsString, // For linking back to jobs after customer creation
  });

  return {
    ...params,
    setParams,
  };
}
