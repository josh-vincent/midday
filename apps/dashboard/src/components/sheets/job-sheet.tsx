"use client";

import { useJobParams } from "@/hooks/use-job-params";
import { useTRPC } from "@/trpc/client";
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
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function JobSheet() {
  const trpc = useTRPC();
  const { params, setParams } = useJobParams();
  const isOpen = params.createJob === true || !!params.jobId;
  const isEditMode = !!params.jobId;
  
  const [formData, setFormData] = useState({
    jobNumber: "",
    companyName: "",
    jobDate: new Date().toISOString().split('T')[0],
    status: "pending",
    description: "",
    volume: "",
    weight: "",
    totalAmount: "",
  });

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
        companyName: jobData.customer?.name || "",
        jobDate: jobData.jobDate ? new Date(jobData.jobDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: jobData.status || "pending",
        description: jobData.description || "",
        volume: jobData.volume?.toString() || "",
        weight: jobData.weight?.toString() || "",
        totalAmount: jobData.totalAmount?.toString() || "",
      });
    }
  }, [jobData]);

  const handleOnOpenChange = (open: boolean) => {
    if (!open) {
      setParams({ createJob: null, jobId: null });
      // Reset form
      setFormData({
        jobNumber: "",
        companyName: "",
        jobDate: new Date().toISOString().split('T')[0],
        status: "pending",
        description: "",
        volume: "",
        weight: "",
        totalAmount: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement job creation via tRPC
    console.log("Creating job:", formData);
    handleOnOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOnOpenChange}>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Edit Job' : 'Create New Job'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Update job details.' : 'Add a new job to track your deliveries and invoicing.'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="jobNumber">Job Number</Label>
              <Input
                id="jobNumber"
                value={formData.jobNumber}
                onChange={(e) => setFormData({ ...formData, jobNumber: e.target.value })}
                placeholder="JOB-001"
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
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the job"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
                placeholder="0.00"
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
              <Label htmlFor="totalAmount">Amount ($)</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                placeholder="0.00"
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
  );
}