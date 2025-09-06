import { useQueryStates } from "nuqs";
import { parseAsBoolean, parseAsString } from "nuqs/server";

export function useTrackerParams() {
  const [params, setParams] = useQueryStates({
    trackerId: parseAsString,
    createTracker: parseAsBoolean,
  });

  return {
    ...params,
    setParams,
  };
}
