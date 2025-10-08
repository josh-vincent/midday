"use client";

import { smartBadgeRenderer } from "@midday/ai-search";
import { generateJobFilters } from "@/actions/ai/generate-job-filters";
import { QuickDateFilters } from "@/components/quick-date-filters";
import { useJobFilterParams } from "@/hooks/use-job-filter-params";
import { useTRPC } from "@/trpc/client";
import { getDateRange } from "@/utils/date";
import { Button } from "@midday/ui/button";
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
import { Layers } from "lucide-react";
import { Input } from "@midday/ui/input";
import { useQuery } from "@tanstack/react-query";
import { formatISO, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { FilterList } from "./filter-list";

const allowedStatuses = [
  "pending",
  "in_progress", 
  "completed",
  "cancelled",
  "invoiced",
];

export function JobsSearchFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();

  const { setParams, filter } = useJobFilterParams();

  const { data: customersData } = useQuery(trpc.customers.get.queryOptions());

  const statusFilters = allowedStatuses.map((status) => ({
    id: status,
    name: status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1),
  }));

  useHotkeys(
    "esc",
    () => {
      setParams({
        q: null,
        status: null,
        customerId: null,
        start: null,
        end: null,
      });
      setPrompt("");
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
    const { object } = await generateJobFilters(
      prompt,
      `Available statuses: ${statusFilters.map((s) => s.name).join(", ")}
       Available customers: ${customersData?.data?.map((c) => c.name).join(", ")}`,
    );

    if (object) {
      // Map customer names to IDs if needed
      let customerId = object.customerId;
      if (!customerId && prompt) {
        const matchedCustomer = customersData?.data?.find((c) =>
          c.name.toLowerCase().includes(prompt.toLowerCase())
        );
        if (matchedCustomer) {
          customerId = matchedCustomer.id;
        }
      }

      setParams({
        q: object.q || null,
        status: object.status || null,
        customerId: customerId || null,
        start: object.start || null,
        end: object.end || null,
      });
    }

    setStreaming(false);
  };

  const handleStatusChange = (statusId: string) => {
    const currentStatus = filter.status;
    
    if (currentStatus === statusId) {
      setParams({ status: null });
    } else {
      setParams({ status: statusId });
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const currentCustomer = filter.customerId;
    
    if (currentCustomer === customerId) {
      setParams({ customerId: null });
    } else {
      setParams({ customerId });
    }
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    setParams({
      start: range?.from
        ? formatISO(range.from, { representation: "date" })
        : null,
      end: range?.to
        ? formatISO(range.to, { representation: "date" })
        : null,
    });
  };

  // Include all filters for display, including search query
  const validFilters = filter;

  const hasValidFilters = Object.entries(filter)
    .filter(([key]) => key !== "groupBy")
    .some(([, value]) => value !== null);

  // Format filters for display - include q for badge
  const displayFilters: Record<string, any> = {};
  if (filter.q) {
    displayFilters.q = filter.q;
  }
  if (filter.status) {
    displayFilters.statuses = [filter.status];
  }
  if (filter.customerId) {
    displayFilters.customers = [filter.customerId];
  }
  if (filter.start || filter.end) {
    displayFilters.start = filter.start;
    displayFilters.end = filter.end;
  }
  if (filter.groupBy && filter.groupBy.length > 0) {
    displayFilters.groupBy = filter.groupBy;
  }

  return (
    <div className="space-y-3">
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
              placeholder="Search jobs or filter..."
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
            filters={displayFilters}
            loading={streaming}
            onRemove={(updatedFilters) => {
              // Map back to our param structure
              setParams({
                q: updatedFilters.q || null,
                status: updatedFilters.statuses?.[0] || null,
                customerId: updatedFilters.customers?.[0] || null,
                start: updatedFilters.start || null,
                end: updatedFilters.end || null,
                groupBy: updatedFilters.groupBy || null,
              });
            }}
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
              <span>Job Date</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0 w-auto"
              >
                <div className="flex">
                  <div className="w-32 border-r py-2">
                    <div className="flex flex-col px-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 font-normal"
                        onClick={() => {
                          const today = new Date();
                          handleDateRangeChange({ from: today, to: today });
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 font-normal"
                        onClick={() => {
                          const yesterday = subDays(new Date(), 1);
                          handleDateRangeChange({ from: yesterday, to: yesterday });
                        }}
                      >
                        Yesterday
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 font-normal"
                        onClick={() => {
                          const today = new Date();
                          handleDateRangeChange({ from: subDays(today, 6), to: today });
                        }}
                      >
                        Last 7 days
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 font-normal"
                        onClick={() => {
                          const today = new Date();
                          handleDateRangeChange({ from: subDays(today, 29), to: today });
                        }}
                      >
                        Last 30 days
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 font-normal"
                        onClick={() => {
                          const today = new Date();
                          handleDateRangeChange({ from: startOfMonth(today), to: today });
                        }}
                      >
                        Month to date
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 font-normal"
                        onClick={() => {
                          const today = new Date();
                          const lastMonth = subMonths(today, 1);
                          handleDateRangeChange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
                        }}
                      >
                        Last month
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 font-normal"
                        onClick={() => {
                          const today = new Date();
                          handleDateRangeChange({ from: startOfYear(today), to: today });
                        }}
                      >
                        Year to date
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-2 font-normal"
                        onClick={() => {
                          const today = new Date();
                          const lastYear = subYears(today, 1);
                          handleDateRangeChange({ from: startOfYear(lastYear), to: endOfYear(lastYear) });
                        }}
                      >
                        Last year
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <Calendar
                      mode="range"
                      initialFocus
                      selected={{
                        from: filter?.start ? new Date(filter.start) : undefined,
                        to: filter?.end ? new Date(filter.end) : undefined,
                      }}
                      onSelect={handleDateRangeChange}
                    />
                  </div>
                </div>
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
                    checked={filter?.customerId === customer.id}
                    onCheckedChange={() => handleCustomerChange(customer.id)}
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
                    checked={filter?.status === status.id}
                    onCheckedChange={() => handleStatusChange(status.id)}
                  >
                    {status.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Layers className="mr-2 h-4 w-4" />
              <span>Group By</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent
                sideOffset={14}
                alignOffset={-4}
                className="p-0"
              >
                <DropdownMenuCheckboxItem
                  checked={filter?.groupBy?.includes("customer") || false}
                  onCheckedChange={(checked) => {
                    const current = filter?.groupBy || [];
                    const updated = checked 
                      ? [...current, "customer"]
                      : current.filter(g => g !== "customer");
                    setParams({ groupBy: updated.length > 0 ? updated : null });
                  }}
                >
                  Customer
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filter?.groupBy?.includes("company") || false}
                  onCheckedChange={(checked) => {
                    const current = filter?.groupBy || [];
                    const updated = checked 
                      ? [...current, "company"]
                      : current.filter(g => g !== "company");
                    setParams({ groupBy: updated.length > 0 ? updated : null });
                  }}
                >
                  Company
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filter?.groupBy?.includes("jobNumber") || false}
                  onCheckedChange={(checked) => {
                    const current = filter?.groupBy || [];
                    const updated = checked 
                      ? [...current, "jobNumber"]
                      : current.filter(g => g !== "jobNumber");
                    setParams({ groupBy: updated.length > 0 ? updated : null });
                  }}
                >
                  Job Number
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filter?.groupBy?.includes("rego") || false}
                  onCheckedChange={(checked) => {
                    const current = filter?.groupBy || [];
                    const updated = checked 
                      ? [...current, "rego"]
                      : current.filter(g => g !== "rego");
                    setParams({ groupBy: updated.length > 0 ? updated : null });
                  }}
                >
                  Registration (Rego)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filter?.groupBy?.includes("date") || false}
                  onCheckedChange={(checked) => {
                    const current = filter?.groupBy || [];
                    const updated = checked 
                      ? [...current, "date"]
                      : current.filter(g => g !== "date");
                    setParams({ groupBy: updated.length > 0 ? updated : null });
                  }}
                >
                  Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filter?.groupBy?.includes("material") || false}
                  onCheckedChange={(checked) => {
                    const current = filter?.groupBy || [];
                    const updated = checked 
                      ? [...current, "material"]
                      : current.filter(g => g !== "material");
                    setParams({ groupBy: updated.length > 0 ? updated : null });
                  }}
                >
                  Material Type
                </DropdownMenuCheckboxItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
  );
}