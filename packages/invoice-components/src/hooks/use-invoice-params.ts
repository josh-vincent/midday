import { useQueryStates } from "nuqs";
import { createLoader, parseAsString, parseAsStringEnum, parseAsArrayOf } from "nuqs/server";

const invoiceParamsSchema = {
  selectedCustomerId: parseAsString,
  type: parseAsStringEnum(["edit", "create", "details", "success"]),
  invoiceId: parseAsString,
  jobId: parseAsString,
  fromJobs: parseAsString,
  templateId: parseAsString,
  jobIds: parseAsArrayOf(parseAsString),
};

export function useInvoiceParams() {
  const [params, setParams] = useQueryStates(invoiceParamsSchema);

  return {
    ...params,
    setParams,
  };
}

export const loadInvoiceParams = createLoader(invoiceParamsSchema);