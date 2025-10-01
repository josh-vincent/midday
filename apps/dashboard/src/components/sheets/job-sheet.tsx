"use client";

import { useJobParams } from "@/hooks/use-job-params";
import { useTRPC } from "@/trpc/client";
import { getLocalDateString, toLocalDateString } from "@/utils/date";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@midday/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useToast } from "@midday/ui/use-toast";

const MATERIAL_OPTIONS = [
  { value: "Dry Clean Fill", label: "Dry Clean Fill" },
  { value: "Wet Fill", label: "Wet Fill" },
  { value: "Rock", label: "Rock" },
  { value: "Sand", label: "Sand" },
  { value: "Topsoil", label: "Topsoil" },
  { value: "Clay", label: "Clay" },
  { value: "Gravel", label: "Gravel" },
  { value: "Concrete", label: "Concrete" },
  { value: "Asphalt", label: "Asphalt" },
  { value: "Mixed", label: "Mixed" },
  { value: "Other", label: "Other" },
];

export function JobSheet() {
  const trpc = useTRPC();
  const { params, setParams } = useJobParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOpen = params.createJob === true || !!params.jobId;
  const isEditMode = !!params.jobId;
  
  const [formData, setFormData] = useState({
    jobNumber: "",
    companyName: "",
    jobDate: getLocalDateString(),
    status: "delivered",
    description: "",
    volume: "",
    weight: "",
    totalAmount: "",
    rego: "",
    materialType: "",
    addressSite: "",
  });
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch job data when in edit mode
  const { data: jobData } = useQuery({
    ...trpc.job.getById.queryOptions({ id: params.jobId! }),
    enabled: isEditMode && !!params.jobId,
  });

  // Update form data when job data is fetched
  useEffect(() => {
    if (jobData) {
      setFormData({
        jobNumber: jobData.jobNumber || "",
        companyName: jobData.customer?.name || jobData.companyName || "",
        jobDate: jobData.jobDate ? toLocalDateString(jobData.jobDate) : getLocalDateString(),
        status: jobData.status || "delivered",
        description: jobData.description || "",
        volume: jobData.cubicMetreCapacity?.toString() || "",
        weight: jobData.weight?.toString() || "",
        totalAmount: jobData.pricePerUnit?.toString() || "",
        rego: jobData.rego || "",
        materialType: jobData.materialType || "",
        addressSite: jobData.addressSite || "",
      });
    }
  }, [jobData]);
  
  // Create job mutation
  const createJobMutation = useMutation(
    trpc.job.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' && 
                   queryKey[1] && 
                   queryKey[1].toString().startsWith('job.');
          },
        });
        toast({
          title: "Success",
          description: "Job created successfully",
        });
        handleOnOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create job",
          variant: "destructive",
        });
      },
    })
  );

  const handleOnOpenChange = (open: boolean) => {
    if (!open) {
      setParams({ createJob: null, jobId: null });
      // Reset form
      setFormData({
        jobNumber: "",
        companyName: "",
        jobDate: getLocalDateString(),
        status: "delivered",
        description: "",
        volume: "",
        weight: "",
        totalAmount: "",
        rego: "",
        materialType: "",
        addressSite: "",
      });
      setShowConfirmDialog(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Show confirmation dialog before creating the job
    setShowConfirmDialog(true);
  };
  
  const handleConfirmCreate = async () => {
    // Close the confirmation dialog
    setShowConfirmDialog(false);
    
    // Create the job with the form data
    await createJobMutation.mutateAsync({
      companyName: formData.companyName,
      rego: formData.rego,
      jobNumber: formData.jobNumber,
      jobDate: formData.jobDate,
      status: formData.status as "pending" | "in_progress" | "completed" | "cancelled" | "delivered",
      description: formData.description,
      volume: formData.volume ? parseFloat(formData.volume) : undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      materialType: formData.materialType,
      addressSite: formData.addressSite,
      pricePerUnit: formData.totalAmount ? parseFloat(formData.totalAmount) : 85,
      cubicMetreCapacity: formData.volume ? parseFloat(formData.volume) : 22,
      loadNumber: 1,
    });
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Edit Job' : 'Create New Job'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Update job details.' : 'Add a new job to track your deliveries.'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="ABC Construction Ltd"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rego">Rego</Label>
              <Input
                id="rego"
                value={formData.rego}
                onChange={(e) => setFormData({ ...formData, rego: e.target.value.toUpperCase() })}
                placeholder="ABC123"
                className="font-bold text-lg"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobDate">Job Date</Label>
              <Input
                id="jobDate"
                type="date"
                value={formData.jobDate}
                onChange={(e) => setFormData({ ...formData, jobDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materialType">Material Type</Label>
            <Select 
              value={formData.materialType} 
              onValueChange={(value) => setFormData({ ...formData, materialType: value })}
            >
              <SelectTrigger id="materialType">
                <SelectValue placeholder="Select material type" />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="addressSite">Address/Site</Label>
            <Input
              id="addressSite"
              value={formData.addressSite}
              onChange={(e) => setFormData({ ...formData, addressSite: e.target.value })}
              placeholder="123 Main St, Sydney NSW 2000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobNumber">Job Number (Optional)</Label>
            <Input
              id="jobNumber"
              value={formData.jobNumber}
              onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
              placeholder="JOB-001"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume (m³)</Label>
              <Input
                id="volume"
                type="number"
                step="0.01"
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                placeholder="22.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Price/m³ ($)</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="85.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handleOnOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? 'Update Job' : 'Create Job'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
    
    {/* Confirmation Dialog */}
    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Job Creation</AlertDialogTitle>
          <AlertDialogDescription>
            Please review the job details before confirming:
            <div className="mt-4 space-y-2 text-sm">
              <div><strong>Company:</strong> {formData.companyName || "Not specified"}</div>
              <div><strong>Rego:</strong> {formData.rego || "Not specified"}</div>
              <div><strong>Material:</strong> {formData.materialType || "Not specified"}</div>
              <div><strong>Date:</strong> {formData.jobDate}</div>
              {formData.addressSite && <div><strong>Site:</strong> {formData.addressSite}</div>}
              {formData.volume && <div><strong>Volume:</strong> {formData.volume} m³</div>}
              {formData.totalAmount && <div><strong>Price per m³:</strong> ${formData.totalAmount}</div>}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
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