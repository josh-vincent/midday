"use client";

import { useState, useEffect } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { useToast } from "@midday/ui/use-toast";
import { Plus } from "lucide-react";

const queues = ["email", "invoice", "sync", "export", "webhook"] as const;
const jobTypes = {
  email: ["send", "batch-send", "template-process"],
  invoice: ["generate", "send", "reminder", "reconcile"],
  sync: ["full-sync", "incremental-sync", "webhook-sync"],
  export: ["pdf", "csv", "excel", "json"],
  webhook: ["delivery", "retry", "batch"],
};

export function CreateJobSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    queue: "" as keyof typeof jobTypes | "",
    type: "",
    priority: "3",
    maxAttempts: "3",
    data: "{}",
  });

  useEffect(() => {
    const handleOpenCreateJob = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-create-job', handleOpenCreateJob as EventListener);
    return () => {
      window.removeEventListener('open-create-job', handleOpenCreateJob as EventListener);
    };
  }, []);

  const handleQueueChange = (queue: keyof typeof jobTypes) => {
    setFormData(prev => ({
      ...prev,
      queue,
      type: "", // Reset type when queue changes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.queue || !formData.type) {
      toast({
        title: "Validation Error",
        description: "Please select both queue and job type",
        variant: "destructive",
      });
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(formData.data);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please enter valid JSON data",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Mock job creation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Job Created",
        description: `${formData.type} job has been added to ${formData.queue} queue`,
      });
      
      // Reset form
      setFormData({
        queue: "",
        type: "",
        priority: "3",
        maxAttempts: "3",
        data: "{}",
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableTypes = formData.queue ? jobTypes[formData.queue] : [];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Job
          </SheetTitle>
          <SheetDescription>
            Add a new job to the queue processing system
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="queue">Queue *</Label>
            <Select value={formData.queue} onValueChange={handleQueueChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a queue" />
              </SelectTrigger>
              <SelectContent>
                {queues.map((queue) => (
                  <SelectItem key={queue} value={queue} className="capitalize">
                    {queue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Job Type *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(type) => setFormData(prev => ({ ...prev, type }))}
              disabled={!formData.queue}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(priority) => setFormData(prev => ({ ...prev, priority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High (1)</SelectItem>
                  <SelectItem value="2">Medium (2)</SelectItem>
                  <SelectItem value="3">Low (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                min="1"
                max="10"
                value={formData.maxAttempts}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, maxAttempts: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Job Data (JSON) *</Label>
            <textarea
              id="data"
              className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder='{"key": "value"}'
              value={formData.data}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, data: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Enter the job data as a JSON object
            </p>
          </div>

          {/* Sample data based on queue */}
          {formData.queue && (
            <div className="bg-muted rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Sample data for {formData.queue}:</p>
              <pre className="text-xs text-muted-foreground overflow-auto">
                {formData.queue === "email" && JSON.stringify({
                  to: "user@example.com",
                  subject: "Welcome!",
                  template: "welcome"
                }, null, 2)}
                {formData.queue === "invoice" && JSON.stringify({
                  invoiceId: "inv_123",
                  customerId: "cus_456"
                }, null, 2)}
                {formData.queue === "sync" && JSON.stringify({
                  provider: "stripe",
                  accountId: "acc_789"
                }, null, 2)}
                {formData.queue === "export" && JSON.stringify({
                  reportType: "monthly",
                  period: "2024-10",
                  format: "pdf"
                }, null, 2)}
                {formData.queue === "webhook" && JSON.stringify({
                  url: "https://api.example.com/webhook",
                  event: "payment.completed"
                }, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.queue || !formData.type} 
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Job"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}