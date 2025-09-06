"use client";

import { useJobFilterParams } from "@/hooks/use-job-filter-params";
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
  "pending",
  "in_progress", 
  "completed",
  "cancelled",
  "invoiced",
];

export function JobsSearchFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();

  const { setParams, filter } = useJobFilterParams();
  
  // Use the search value from filter params
  const searchValue = filter.q || "";

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
      setIsOpen(false);
    },
    {
      enableOnFormTags: true,
      enabled: Boolean(searchValue),
    },
  );

  useHotkeys("meta+s", (evt) => {
    evt.preventDefault();
    inputRef.current?.focus();
  });

  const handleSearch = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const value = evt.target.value;
    // Immediately update search query in URL params
    setParams({ q: value || null });
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

  const validFilters = Object.fromEntries(
    Object.entries(filter).filter(([key, value]) => key !== "q" && value !== null),
  );

  const hasValidFilters = Object.values(validFilters).some(
    (value) => value !== null,
  );

  // Format filters for display
  const displayFilters: Record<string, any> = {};
  if (filter.status) {
    displayFilters.statuses = [filter.status]; // Use statuses array for FilterList
  }
  if (filter.customerId) {
    displayFilters.customers = [filter.customerId];
  }
  if (filter.start || filter.end) {
    displayFilters.start = filter.start;
    displayFilters.end = filter.end;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 items-start sm:items-center w-full">
        <form
          className="relative w-full sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Icons.Search className="absolute pointer-events-none left-3 top-[11px]" />
          <Input
            ref={inputRef}
            placeholder="Search jobs..."
            className="pl-9 w-full sm:w-[350px] pr-8"
            value={searchValue}
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
          loading={false}
          onRemove={(updatedFilters) => {
            // Map back to our param structure
            setParams({
              status: updatedFilters.statuses?.[0] || null,
              customerId: updatedFilters.customers?.[0] || null,
              start: updatedFilters.start || null,
              end: updatedFilters.end || null,
            });
          }}
          statusFilters={statusFilters}
          customers={customersData?.data}
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
                className="p-0"
              >
                <Calendar
                  mode="range"
                  initialFocus
                  selected={{
                    from: filter?.start ? new Date(filter.start) : undefined,
                    to: filter?.end ? new Date(filter.end) : undefined,
                  }}
                  onSelect={handleDateRangeChange}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
