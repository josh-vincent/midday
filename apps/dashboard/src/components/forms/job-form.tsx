"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { useJobParams } from "@/hooks/use-job-params";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@midday/ui/button";
import { Calendar } from "@midday/ui/calendar";
import { cn } from "@midday/ui/cn";
import { ComboboxDropdown } from "@midday/ui/combobox-dropdown";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@midday/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Textarea } from "@midday/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Info, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { SelectCustomer } from "../select-customer";

const jobFormSchema = z.object({
  customerId: z.string().optional().nullable(),
  jobNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  contactNumber: z.string().optional(),
  rego: z.string().optional(),
  loadNumber: z.number().optional(),
  companyName: z.string().optional(),
  addressSite: z.string().optional(),
  equipmentType: z.string().optional(),
  materialType: z.string().optional(),
  pricePerUnit: z.number().optional(),
  cubicMetreCapacity: z.number().optional(),
  jobDate: z.date().optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .default("pending"),
  notes: z.string().optional(),
});

type JobFormData = z.infer<typeof jobFormSchema>;

const EQUIPMENT_OPTIONS = [
  { value: "Truck & Trailer 22m3", label: "Truck & Trailer 22m3" },
  { value: "Truck & Quad 26m3", label: "Truck & Quad 26m3" },
  { value: "Tandem 10m3", label: "Tandem 10m3" },
  { value: "Single Truck", label: "Single Truck" },
  { value: "Other", label: "Other" },
];

const MATERIAL_OPTIONS = [
  { value: "Dry Clean Fill", label: "Dry Clean Fill" },
  { value: "Wet Fill", label: "Wet Fill" },
  { value: "Rock", label: "Rock" },
  { value: "Sand", label: "Sand" },
  { value: "Topsoil", label: "Topsoil" },
  { value: "Clay", label: "Clay" },
  { value: "Mixed Waste", label: "Mixed Waste" },
  { value: "Other", label: "Other" },
];

interface JobFormProps {
  job?: JobFormData & { id: string };
  onSuccess?: () => void;
}

export function JobForm({ job, onSuccess }: JobFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const { setParams, customerId: urlCustomerId } = useJobParams();
  const { setParams: setCustomerParams } = useCustomerParams();
  const { toast } = useToast();
  const trpc = useTRPC();

  // Query customers for search
  const { data: customersData } = useQuery(
    trpc.customers.get.queryOptions({
      q: customerSearch,
      pageSize: 10,
    }),
  );

  // Handle click outside to close customer search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".customer-search-container")) {
        setShowCustomerSearch(false);
      }
    };

    if (showCustomerSearch) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showCustomerSearch]);

  const createJobMutation = useMutation(
    trpc.job.create.mutationOptions({
      onSuccess: (data) => {
        toast({
          title: "Job created",
          description: "The job has been created successfully.",
        });
        setParams(null);
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create job",
          variant: "destructive",
        });
        setIsSubmitting(false);
      },
    }),
  );

  const updateJobMutation = useMutation(
    trpc.job.update.mutationOptions({
      onSuccess: (data) => {
        toast({
          title: "Job updated",
          description: "The job has been updated successfully.",
        });
        setParams(null);
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update job",
          variant: "destructive",
        });
        setIsSubmitting(false);
      },
    }),
  );

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      customerId: job?.customerId || urlCustomerId || "",
      jobNumber: job?.jobNumber || "",
      contactPerson: job?.contactPerson || "",
      contactNumber: job?.contactNumber || "",
      rego: job?.rego || "",
      loadNumber: job?.loadNumber || undefined,
      companyName: job?.companyName || "",
      addressSite: job?.addressSite || "",
      equipmentType: job?.equipmentType || "",
      materialType: job?.materialType || "",
      pricePerUnit: job?.pricePerUnit || undefined,
      cubicMetreCapacity: job?.cubicMetreCapacity || undefined,
      jobDate: job?.jobDate ? new Date(job.jobDate) : undefined,
      status: job?.status || "pending",
      notes: job?.notes || "",
    },
  });

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);

    const submitData = {
      ...data,
      jobDate: data.jobDate ? format(data.jobDate, "yyyy-MM-dd") : undefined,
    };

    if (job?.id) {
      await updateJobMutation.mutateAsync({
        id: job.id,
        ...submitData,
      });
    } else {
      await createJobMutation.mutateAsync(submitData);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-full"
      >
        <div className="flex-1 overflow-y-auto px-1 -mx-1">
          <div className="grid grid-cols-2 gap-4 pb-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <SelectCustomer
                      value={field.value}
                      onChange={(customerId, customer) => {
                        field.onChange(customerId);
                        if (customer) {
                          form.setValue("companyName", customer.name || "");
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="JOB-2024-001"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Person</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Smith"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0412 345 678"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rego"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rego</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABC-123"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loadNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Load Number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1"
                      autoComplete="off"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                          ? Number.parseInt(e.target.value, 10)
                          : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <div className="relative customer-search-container">
                      <Input
                        placeholder="Search for customer or type new name"
                        autoComplete="off"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          setCustomerSearch(e.target.value);
                          setShowCustomerSearch(true);
                        }}
                        onFocus={() => setShowCustomerSearch(true)}
                      />
                      {showCustomerSearch && customerSearch && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-md border bg-popover p-1 shadow-md">
                          {customersData?.data &&
                          customersData.data.length > 0 ? (
                            <>
                              {customersData.data.map((customer) => (
                                <button
                                  key={customer.id}
                                  type="button"
                                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                                  onClick={() => {
                                    form.setValue("customerId", customer.id);
                                    form.setValue("companyName", customer.name);
                                    setShowCustomerSearch(false);
                                  }}
                                >
                                  <div className="font-medium">
                                    {customer.name}
                                  </div>
                                  {customer.email && (
                                    <div className="text-xs text-muted-foreground">
                                      {customer.email}
                                    </div>
                                  )}
                                </button>
                              ))}
                              <div className="border-t mt-1 pt-1">
                                <button
                                  type="button"
                                  className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                                  onClick={() => {
                                    setCustomerParams({
                                      createCustomer: true,
                                      name: customerSearch,
                                    });
                                    setShowCustomerSearch(false);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                  Create "{customerSearch}" as new customer
                                </button>
                              </div>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                              onClick={() => {
                                setCustomerParams({
                                  createCustomer: true,
                                  name: customerSearch,
                                });
                                setShowCustomerSearch(false);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                              Create "{customerSearch}" as new customer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="addressSite"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <div className="flex items-center gap-2">
                    <FormLabel>Address/Site</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger
                          type="button"
                          className="hover:opacity-70"
                        >
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            The address or site this delivery is coming from
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="123 Main St, Sydney NSW 2000"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="equipmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipment Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EQUIPMENT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="materialType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MATERIAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricePerUnit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price per Unit ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="85.00"
                      autoComplete="off"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                          ? Number.parseFloat(e.target.value)
                          : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cubicMetreCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cubic Metre Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="22"
                      autoComplete="off"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                          ? Number.parseInt(e.target.value, 10)
                          : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-between pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setParams(null)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? job?.id
                ? "Updating..."
                : "Creating..."
              : job?.id
                ? "Update Job"
                : "Create Job"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
