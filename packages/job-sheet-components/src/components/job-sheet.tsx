"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Textarea } from "@midday/ui/textarea";
import type { JobSheetProps } from "../types";

interface JobSheetComponentProps extends JobSheetProps {
  formData: any;
  onFormChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditMode?: boolean;
}

export function JobSheet({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  isEditMode = false,
}: JobSheetComponentProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditMode ? "Edit Job" : "Create New Job"}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update job information"
              : "Add a new job to track your deliveries."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName || ""}
                onChange={(e) =>
                  onFormChange({ ...formData, companyName: e.target.value })
                }
                placeholder="ABC Construction Ltd"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobNumber">Job Number</Label>
              <Input
                id="jobNumber"
                value={formData.jobNumber || ""}
                onChange={(e) =>
                  onFormChange({ ...formData, jobNumber: e.target.value })
                }
                placeholder="JOB-001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || "delivered"}
                onValueChange={(value) =>
                  onFormChange({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                onFormChange({ ...formData, description: e.target.value })
              }
              placeholder="Job description..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Update Job" : "Create Job"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
