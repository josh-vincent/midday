import type { SearchParams } from "nuqs";

export function loadJobFilterParams(searchParams: SearchParams) {
  return {
    status: searchParams.status as string | undefined,
    q: searchParams.q as string | undefined,
    customerId: searchParams.customerId as string | undefined,
    start: searchParams.start as string | undefined,
    end: searchParams.end as string | undefined,
  };
}