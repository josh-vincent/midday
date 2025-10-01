import { useQueryStates } from "nuqs";
import { createLoader, parseAsString, parseAsStringEnum } from "nuqs/server";

const invoiceDataTemplateParamsSchema = {
  templateId: parseAsString,
  create: parseAsStringEnum(["true", "false"]),
  edit: parseAsStringEnum(["true", "false"]),
  duplicate: parseAsString, // ID of template to duplicate from
  import: parseAsStringEnum(["true", "false"]),
};

export function useInvoiceDataTemplateParams() {
  const [params, setParams] = useQueryStates(invoiceDataTemplateParamsSchema);

  return {
    ...params,
    setParams,
  };
}

export const loadInvoiceDataTemplateParams = createLoader(
  invoiceDataTemplateParamsSchema,
);
