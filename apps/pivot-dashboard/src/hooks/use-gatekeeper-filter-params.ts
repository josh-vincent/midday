import { useQueryStates } from "nuqs";
import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const gatekeeperFilterParamsSchema = {
  q: parseAsString,
};

export function useGatekeeperFilterParams() {
  const [filter, setFilter] = useQueryStates(gatekeeperFilterParamsSchema);

  return {
    filter,
    setFilter,
    hasFilters: Object.values(filter).some((value) => value !== null),
  };
}

export const loadGatekeeperFilterParams = createLoader(
  gatekeeperFilterParamsSchema,
);