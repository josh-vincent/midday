import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const sortParamsSchema = {
  sort: parseAsArrayOf(parseAsString),
};

export const loadSortParams = createLoader(sortParamsSchema);