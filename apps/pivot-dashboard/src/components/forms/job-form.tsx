"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { useJobParams } from "@/hooks/use-job-params";
import { useTRPC } from "@/trpc/client";
import { getLocalDateString } from "@/utils/date";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Info, Plus } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { SelectCustomer } from "../select-customer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midday/ui/alert-dialog";

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
    .enum(["pending", "in_progress", "completed", "cancelled", "delivered"])
    .default("delivered"),
  notes: z.string().optional(),
});

type JobFormData = z.infer<typeof jobFormSchema>;

const EQUIPMENT_OPTIONS = [
  { value: "Truck & Trailer 22m3", label: "Truck & Trailer 22m3", capacity: 22 },
  { value: "Truck & Quad 26m3", label: "Truck & Quad 26m3", capacity: 26 },
  { value: "Tandem 10m3", label: "Tandem 10m3", capacity: 10 },
  { value: "Single Truck", label: "Single Truck", capacity: 8 },
  { value: "Other", label: "Other", capacity: null },
];

const MATERIAL_OPTIONS = [
  { value: "Dry Clean Fill", label: "Dry Clean Fill", defaultPrice: 85.00 },
  { value: "Wet Fill", label: "Wet Fill", defaultPrice: 75.00 },
  { value: "Rock", label: "Rock", defaultPrice: 95.00 },
  { value: "Sand", label: "Sand", defaultPrice: 80.00 },
  { value: "Topsoil", label: "Topsoil", defaultPrice: 90.00 },
  { value: "Clay", label: "Clay", defaultPrice: 70.00 },
  { value: "Mixed Waste", label: "Mixed Waste", defaultPrice: 110.00 },
  { value: "Other", label: "Other", defaultPrice: null },
];

interface JobFormProps {
  job?: JobFormData & { id: string };
  onSuccess?: () => void;
}

export function JobForm({ job, onSuccess }: JobFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<JobFormData | null>(null);
  const { setParams, customerId: urlCustomerId } = useJobParams();
  const { setParams: setCustomerParams } = useCustomerParams();
  const { toast } = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

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
      onSuccess: async (data) => {
        // Immediately refetch the gatekeeper query for today to show the new entry
        const today = getLocalDateString();
        await queryClient.refetchQueries({
          queryKey: [
            ['job', 'getJobsGroupedByTruckForDate'],
            { input: { date: today }, type: 'query' }
          ],
          exact: false,
        });

        // Invalidate all other job queries to ensure they refresh when accessed
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' &&
                   queryKey[1] &&
                   queryKey[1].toString().startsWith('job.');
          },
        });

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
      onSuccess: async (data) => {
        // Immediately refetch the gatekeeper query for today
        const today = getLocalDateString();
        await queryClient.refetchQueries({
          queryKey: [
            ['job', 'getJobsGroupedByTruckForDate'],
            { input: { date: today }, type: 'query' }
          ],
          exact: false,
        });

        // Invalidate all job queries to refresh table and remove warning icons
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' &&
                   queryKey[1] &&
                   queryKey[1].toString().startsWith('job.');
          },
        });

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
      loadNumber: job?.loadNumber ?? 1,
      companyName: job?.companyName || "",
      addressSite: job?.addressSite || "",
      equipmentType: job?.equipmentType || "",
      materialType: job?.materialType || "",
      pricePerUnit: job?.pricePerUnit ?? undefined,
      cubicMetreCapacity: job?.cubicMetreCapacity ?? undefined,
      jobDate: job?.jobDate ? new Date(job.jobDate) : new Date(),
      status: job?.status || "delivered",
      notes: job?.notes || "",
    },
  });

  const onSubmit = async (data: JobFormData) => {
    // For new jobs, show confirmation dialog
    if (!job?.id) {
      setPendingFormData(data);
      setShowConfirmDialog(true);
    } else {
      // For edits, submit directly without confirmation
      setIsSubmitting(true);
      const submitData = {
        ...data,
        jobDate: data.jobDate ? format(data.jobDate, "yyyy-MM-dd") : undefined,
      };
      await updateJobMutation.mutateAsync({
        id: job.id,
        ...submitData,
      });
    }
  };
  
  const handleConfirmCreate = async () => {
    if (!pendingFormData) return;
    
    setShowConfirmDialog(false);
    setIsSubmitting(true);
    
    const submitData = {
      ...pendingFormData,
      jobDate: pendingFormData.jobDate ? format(pendingFormData.jobDate, "yyyy-MM-dd") : undefined,
      loadNumber: pendingFormData.loadNumber || 1, // Default to 1 if not specified
    };
    
    await createJobMutation.mutateAsync(submitData);
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col h-full"
        >
          <div className="flex-1 overflow-y-auto px-1 -mx-1">
            <div className="grid grid-cols-2 gap-4 pb-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Customer</FormLabel>
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
              name="rego"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Rego</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABC-123"
                      autoComplete="off"
                      className="text-lg font-medium"
                      {...field}
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


            {/* Dont need this for Gatekeeper 
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
                      value={field.value ?? ""}
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
            /> */}

            

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
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    // Auto-fill capacity based on equipment type
                    const selectedEquipment = EQUIPMENT_OPTIONS.find(opt => opt.value === value);
                    if (selectedEquipment?.capacity) {
                      form.setValue("cubicMetreCapacity", selectedEquipment.capacity);
                    }
                  }} value={field.value}>
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
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    // Auto-fill price based on material type
                    const selectedMaterial = MATERIAL_OPTIONS.find(opt => opt.value === value);
                    if (selectedMaterial?.defaultPrice) {
                      form.setValue("pricePerUnit", selectedMaterial.defaultPrice);
                    }
                  }} value={field.value}>
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
                      value={field.value ?? ""}
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
                      value={field.value ?? ""}
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

            {/* <FormField
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
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

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
          <Button className="bg-primary w-3/4 text-primary-foreground" disabled={isSubmitting} type="submit">
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
      
      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Job Creation</AlertDialogTitle>
          <AlertDialogDescription>
            Please review the job details before confirming:
            <div className="mt-4 space-y-2 text-sm">
              <div><strong>Company:</strong> {pendingFormData?.companyName || "Not specified"}</div>
              <div><strong>Rego:</strong> {pendingFormData?.rego || "Not specified"}</div>
              <div><strong>Load Number:</strong> {pendingFormData?.loadNumber || 1}</div>
              {pendingFormData?.materialType && <div><strong>Material Type:</strong> {pendingFormData.materialType}</div>}
              {pendingFormData?.equipmentType && <div><strong>Equipment Type:</strong> {pendingFormData.equipmentType}</div>}
              {pendingFormData?.cubicMetreCapacity && <div><strong>Cubic Metres:</strong> {pendingFormData.cubicMetreCapacity} m³</div>}
              {pendingFormData?.pricePerUnit && <div><strong>Price per Unit:</strong> ${pendingFormData.pricePerUnit.toFixed(2)}</div>}
              {pendingFormData?.jobDate && <div><strong>Date:</strong> {format(pendingFormData.jobDate, "PPP")}</div>}
              {pendingFormData?.addressSite && <div><strong>Site:</strong> {pendingFormData.addressSite}</div>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setShowConfirmDialog(false);
            setPendingFormData(null);
          }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmCreate}>
            Confirm & Create Job
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
