"use client";

import { useJobsStore } from "@/store/jobs";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { Icons } from "@midday/ui/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";

export function JobsColumnVisibility() {
  const { columnVisibility, setColumnVisibility } = useJobsStore();

  const columns = [
    { id: "jobDate", label: "Date" },
    { id: "jobNumber", label: "Job Number" },
    { id: "contact", label: "Contact" },
    { id: "vehicle", label: "Vehicle" },
    { id: "material", label: "Material" },
    { id: "amount", label: "Amount" },
    { id: "status", label: "Status" },
  ];

  const handleToggle = (columnId: string) => {
    setColumnVisibility({
      ...columnVisibility,
      [columnId]: !columnVisibility[columnId],
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
                checked={columnVisibility[column.id] !== false}
                onCheckedChange={() => handleToggle(column.id)}
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
