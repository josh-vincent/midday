"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Calendar } from "@midday/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@midday/ui/popover";
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
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  Plus, 
  CalendarIcon,
  Briefcase,
  User,
  Clock,
  AlertTriangle,
  Target,
  DollarSign
} from "lucide-react";
import { useForm } from "react-hook-form";
import type { MockJob } from "@/lib/mock/jobs-mock";

type JobFormData = {
  title: string;
  description?: string;
  projectId?: string;
  clientId: string;
  assigneeId?: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedHours: number;
  hourlyRate: number;
  dueDate?: Date;
  tags?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateJob?: (job: Partial<MockJob>) => void;
  initialData?: Partial<JobFormData>;
};

const priorities = [
  { value: "low", label: "Low Priority", icon: Target },
  { value: "medium", label: "Medium Priority", icon: Target },
  { value: "high", label: "High Priority", icon: AlertTriangle },
  { value: "urgent", label: "Urgent Priority", icon: AlertTriangle },
];

const projects = [
  { value: "proj_1", label: "Website Redesign" },
  { value: "proj_2", label: "Mobile App Development" },
  { value: "proj_3", label: "Marketing Campaign" },
  { value: "proj_4", label: "E-commerce Platform" },
  { value: "proj_5", label: "CRM Implementation" },
];

const clients = [
  { value: "client_1", label: "Acme Corporation", email: "contact@acmecorp.com" },
  { value: "client_2", label: "TechStart Inc", email: "hello@techstart.com" },
  { value: "client_3", label: "Global Services Ltd", email: "info@globalservices.com" },
  { value: "client_4", label: "Digital Agency Co", email: "team@digitalagency.com" },
  { value: "client_5", label: "Enterprise Solutions", email: "contact@enterprise.com" },
];

const assignees = [
  { value: "user_1", label: "John Smith" },
  { value: "user_2", label: "Sarah Johnson" },
  { value: "user_3", label: "Mike Chen" },
  { value: "user_4", label: "Emily Davis" },
  { value: "user_5", label: "Alex Thompson" },
];

export function JobCreateSheet({ 
  open, 
  onOpenChange, 
  onCreateJob,
  initialData 
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<JobFormData>({
    defaultValues: {
      priority: "medium",
      estimatedHours: 10,
      hourlyRate: 100,
      ...initialData
    }
  });

  const watchedDueDate = watch("dueDate");
  const watchedPriority = watch("priority");

  const onSubmit = async (data: JobFormData) => {
    setIsLoading(true);
    try {
      const selectedClient = clients.find(c => c.value === data.clientId);
      const selectedAssignee = assignees.find(a => a.value === data.assigneeId);
      const selectedProject = projects.find(p => p.value === data.projectId);

      const jobData: Partial<MockJob> = {
        title: data.title,
        description: data.description,
        projectId: data.projectId,
        projectName: selectedProject?.label,
        client: selectedClient ? {
          id: selectedClient.value,
          name: selectedClient.label,
          email: selectedClient.email,
        } : clients[0], // fallback
        assignee: selectedAssignee ? {
          id: selectedAssignee.value,
          name: selectedAssignee.label,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedAssignee.value}`,
        } : undefined,
        priority: data.priority,
        estimatedHours: data.estimatedHours,
        hourlyRate: data.hourlyRate,
        dueDate: data.dueDate?.toISOString(),
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : undefined,
        status: "pending",
        progress: 0,
        actualHours: 0,
      };

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onCreateJob?.(jobData);
      
      toast({
        title: "Job Created",
        description: `${data.title} has been successfully created`,
      });
      
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Job
          </SheetTitle>
          <SheetDescription>
            Create a new job and assign it to team members
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                placeholder="Enter job title"
                {...register("title", { required: "Job title is required" })}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the job requirements and objectives"
                className="min-h-[100px]"
                {...register("description")}
              />
            </div>
          </div>

          {/* Project and Client */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select onValueChange={(value) => setValue("projectId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.value} value={project.value}>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {project.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client *</Label>
              <Select onValueChange={(value) => setValue("clientId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.value} value={client.value}>
                      <div>
                        <div className="font-medium">{client.label}</div>
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-500">{errors.clientId.message}</p>
              )}
            </div>
          </div>

          {/* Assignment and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee</Label>
              <Select onValueChange={(value) => setValue("assigneeId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to team member" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((assignee) => (
                    <SelectItem key={assignee.value} value={assignee.value}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {assignee.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={watchedPriority} onValueChange={(value: any) => setValue("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => {
                    const Icon = priority.icon;
                    return (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {priority.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time and Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimated Hours *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="10"
                  className="pl-10"
                  {...register("estimatedHours", { 
                    required: "Estimated hours is required",
                    min: { value: 0.5, message: "Minimum 0.5 hours" }
                  })}
                />
              </div>
              {errors.estimatedHours && (
                <p className="text-sm text-red-500">{errors.estimatedHours.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="hourlyRate"
                  type="number"
                  min="1"
                  placeholder="100"
                  className="pl-10"
                  {...register("hourlyRate", { 
                    required: "Hourly rate is required",
                    min: { value: 1, message: "Minimum $1/hour" }
                  })}
                />
              </div>
              {errors.hourlyRate && (
                <p className="text-sm text-red-500">{errors.hourlyRate.message}</p>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchedDueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedDueDate ? (
                    format(watchedDueDate, "PPP")
                  ) : (
                    <span>Pick a due date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchedDueDate}
                  onSelect={(date) => {
                    setValue("dueDate", date);
                    setDatePickerOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="urgent, client-review, feature (comma separated)"
              {...register("tags")}
            />
            <p className="text-xs text-muted-foreground">
              Enter tags separated by commas
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
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