"use client";

import { useCustomersStore } from "@/store/customers";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";

export function CustomersColumnVisibility() {
  const columnVisibility = useCustomersStore((state) => state.columnVisibility);
  const setColumnVisibility = useCustomersStore((state) => state.setColumnVisibility);

  const columns = [
    { id: "contact", label: "Contact Person" },
    { id: "email", label: "Email" },
    { id: "address", label: "Address" },
    { id: "invoices", label: "Invoices" },
    { id: "projects", label: "Projects" },
  ];

  const handleToggle = (columnId: string, checked: boolean) => {
    setColumnVisibility({
      ...columnVisibility,
      [columnId]: checked,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Icons.Tune size={18} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0" align="end" sideOffset={8}>
        <div className="flex flex-col p-4 space-y-2 max-h-[352px] overflow-auto">
          {columns.map((column) => (
            <div key={column.id} className="flex items-center space-x-2">
              <Checkbox
                id={column.id}
                checked={columnVisibility[column.id] ?? true}
                onCheckedChange={(checked) => handleToggle(column.id, checked as boolean)}
              />
              <label
                htmlFor={column.id}
                className="text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {column.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
