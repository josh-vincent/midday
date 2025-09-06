import { parseAsArrayOf, parseAsString, useQueryStates } from "nuqs";

export function useJobsFilterParams() {
  const [filter, setFilter] = useQueryStates(
    {
      q: parseAsString,
      status: parseAsArrayOf(parseAsString),
      customers: parseAsArrayOf(parseAsString),
      start: parseAsString,
      end: parseAsString,
    },
    {
      shallow: false,
    },
  );

  return {
    ...filter,
    setFilter,
  };
}

export function loadJobsFilterParams(searchParams: Record<string, any>) {
  const status = searchParams?.status
    ? searchParams.status.split(",")
    : undefined;

  const customers = searchParams?.customers
    ? searchParams.customers.split(",")
    : undefined;

  return {
    q: searchParams?.q,
    status,
    customers,
    start: searchParams?.start,
    end: searchParams?.end,
  };
}
