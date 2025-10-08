"use client";

import { smartBadgeRenderer } from "@midday/ai-search";
import { generateInvoiceFilters } from "@/actions/ai/generate-invoice-filters";
import { useInvoiceFilterParams } from "@/hooks/use-invoice-filter-params";
import { useI18n } from "@/locales/client";
import { useTRPC } from "@/trpc/client";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { useQuery } from "@tanstack/react-query";
import { formatISO } from "date-fns";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FilterList } from "./filter-list";

const allowedStatuses = [
  "draft",
  "overdue",
  "paid",
  "unpaid",
  "canceled",
  "scheduled",
];

export function InvoiceSearchFilter() {
  const [prompt, setPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const t = useI18n();
  const [streaming, setStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const trpc = useTRPC();

  const { setParams, filter } = useInvoiceFilterParams();

  const { data: customersData } = useQuery(trpc.customers.get.queryOptions());

  const statusFilters = allowedStatuses.map((status) => ({
    id: status,
    // @ts-expect-error
    name: t(`invoice_status.${status}`),
  }));

  useHotkeys(
    "esc",
    () => {
      setPrompt("");
      setParams(null);
      setIsOpen(false);
    },
    {
      enableOnFormTags: true,
      enabled: Boolean(prompt),
    },
  );

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    inputRef.current?.focus();
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(evt.target.value);
  };

  const handleSubmit = async () => {
    if (!prompt) {
      setParams(null);
      return;
    }

    setStreaming(true);

    // Use AI to generate filters from natural language
    const { object } = await generateInvoiceFilters(
      prompt,
      `Available statuses: ${statusFilters.map((s) => s.name).join(", ")}
       Available customers: ${customersData?.data?.map((c) => c.name).join(", ")}`,
    );

    if (object) {
      // Map customer names to IDs if needed
      const customerIds = object.customers?.map((nameOrId) => {
        // Check if it's already an ID
        if (customersData?.data?.find((c) => c.id === nameOrId)) {
          return nameOrId;
        }
        // Otherwise find by name
        const customer = customersData?.data?.find((c) =>
          c.name.toLowerCase().includes(nameOrId.toLowerCase())
        );
        return customer?.id;
      }).filter(Boolean);

      setParams({
        q: object.q || null,
        statuses: object.statuses || null,
        customers: customerIds || null,
        start: object.start || null,
        end: object.end || null,
      });
    }

    setStreaming(false);
  };

  // Include all filters including search query
  const validFilters = filter;

  const hasValidFilters = Object.values(validFilters).some(
    (value) => value !== null,
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 items-start sm:items-center w-full">
        <form
          className="relative w-full sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
          <Input
            ref={inputRef}
            placeholder="Search or filter"
            className="pl-9 w-full sm:w-[350px] pr-8"
            value={prompt}
            onChange={handleSearch}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
          />

          <DropdownMenuTrigger asChild>
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              type="button"
              className={cn(
                "absolute z-10 right-3 top-[10px] opacity-50 transition-opacity duration-300 hover:opacity-100",
                hasValidFilters && "opacity-100",
                isOpen && "opacity-100",
              )}
            >
              <Icons.Filter />
            </button>
          </DropdownMenuTrigger>
        </form>

        <FilterList
          filters={validFilters}
          loading={streaming}
          onRemove={setParams}
          statusFilters={statusFilters}
          customers={customersData?.data}
          badgeRenderer={smartBadgeRenderer}
        />
      </div>

      <DropdownMenuContent
        className="w-[350px]"
        sideOffset={19}
        alignOffset={-11}
        side="bottom"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.CalendarMonth className="mr-2 h-4 w-4" />
              <span>Due Date</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                <Calendar
                  mode="range"
                  initialFocus
                  selected={{
                    from: filter?.start ? new Date(filter.start) : undefined,
                    to: filter?.end ? new Date(filter.end) : undefined,
                  }}
                  onSelect={(range) => {
                    setParams({
                      start: range?.from
                        ? formatISO(range.from, { representation: "date" })
                        : null,
                      end: range?.to
                        ? formatISO(range.to, { representation: "date" })
                        : null,
                    });
                  }}
                />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Face className="mr-2 h-4 w-4" />
              <span>Customer</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {customersData?.data?.map((customer) => (
                  <DropdownMenuCheckboxItem
                    key={customer.id}
                    checked={filter?.customers?.includes(customer.id)}
                    onCheckedChange={() => {
                      setParams({
                        customers: filter?.customers?.includes(customer.id)
                          ? filter.customers.filter((s) => s !== customer.id)
                          : [...(filter?.customers ?? []), customer.id],
                      });
                    }}
                  >
                    {customer.name}
                  </DropdownMenuCheckboxItem>
                ))}

                {!customersData?.data?.length && (
                  <DropdownMenuItem disabled>
                    No customers found
                  </DropdownMenuItem>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Icons.Status className="mr-2 h-4 w-4" />
              <span>Status</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                {statusFilters?.map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status.id}
                    checked={filter?.statuses?.includes(status.id)}
                    onCheckedChange={() => {
                      setParams({
                        statuses: filter?.statuses?.includes(status.id)
                          ? filter.statuses.filter((s) => s !== status.id)
                          : [...(filter?.statuses ?? []), status.id],
                      });
                    }}
                  >
                    {status.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
