import { useQueryStates } from "nuqs";
import { parseAsArrayOf, parseAsBoolean, parseAsString } from "nuqs/server";

export function useTrackerParams({
  initialDate,
}: { initialDate?: string } = {}) {
  const [params, setParams] = useQueryStates({
    trackerId: parseAsString,
    createTracker: parseAsBoolean,
    date: parseAsString.withDefault(initialDate || new Date().toISOString()),
    range: parseAsArrayOf(parseAsString),
    selectedDate: parseAsString,
  });

  return {
    ...params,
    setParams,
  };
}
