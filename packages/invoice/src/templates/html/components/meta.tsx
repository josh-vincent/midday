import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import type { Template } from "../../../types";

type Props = {
  template: Template;
  invoiceNumber: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
};

// Helper function to convert date format from old to new date-fns format
function convertDateFormat(dateFormat: string): string {
  return dateFormat
    .replace(/DD/g, 'dd')  // days
    .replace(/YYYY/g, 'yyyy')  // years
    .replace(/YY/g, 'yy');  // short years
}

export function Meta({ template, invoiceNumber, issueDate, dueDate }: Props) {
  if (!template) {
    return null;
  }
  
  // Convert the date format to be compatible with date-fns v2+
  const dateFormatPattern = template.dateFormat ? convertDateFormat(template.dateFormat) : 'dd/MM/yyyy';

  return (
    <div className="mb-2">
      <h2 className="text-[21px] font-medium font-mono mb-1 w-fit min-w-[100px]">
        {template.title}
      </h2>
      <div className="flex flex-col gap-0.5">
        <div className="flex space-x-1 items-center">
          <div className="flex items-center flex-shrink-0 space-x-1">
            <span className="truncate font-mono text-[11px] text-[#878787]">
              {template.invoiceNoLabel ? `${template.invoiceNoLabel}:` : ""}
            </span>
            <span className="text-[11px] font-mono flex-shrink-0">
              {invoiceNumber}
            </span>
          </div>
        </div>

        <div>
          <div>
            <div className="flex space-x-1 items-center">
              <div className="flex items-center flex-shrink-0 space-x-1">
                <span className="truncate font-mono text-[11px] text-[#878787]">
                  {template.issueDateLabel ? `${template.issueDateLabel}:` : ""}
                </span>
                <span className="text-[11px] font-mono flex-shrink-0">
                  {issueDate
                    ? format(
                        new TZDate(issueDate, template.timezone),
                        dateFormatPattern,
                      )
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div>
            <div className="flex space-x-1 items-center">
              <div className="flex items-center flex-shrink-0 space-x-1">
                <span className="truncate font-mono text-[11px] text-[#878787]">
                  {template.dueDateLabel ? `${template.dueDateLabel}:` : ""}
                </span>
                <span className="text-[11px] font-mono flex-shrink-0">
                  {dueDate
                    ? format(
                        new TZDate(dueDate, template.timezone),
                        dateFormatPattern,
                      )
                    : ""}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
