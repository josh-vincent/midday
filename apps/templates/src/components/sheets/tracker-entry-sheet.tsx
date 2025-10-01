"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import { Button } from "@midday/ui/button";
import { Textarea } from "@midday/ui/textarea";
import { Switch } from "@midday/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { CalendarIcon, Clock, Trash2 } from "lucide-react";
import type { TimeEntry } from "@/lib/mock/tracker-mock";

const formSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  jobId: z.string().min(1, "Job is required"),
  description: z.string().optional(),
  startDate: z.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  endDate: z.date(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format"),
  duration: z.number().min(0),
  billable: z.boolean(),
  rate: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TrackerEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: TimeEntry | null;
  projects: any[];
  jobs: any[];
  onSave: (data: Partial<TimeEntry>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function TrackerEntrySheet({
  open,
  onOpenChange,
  entry,
  projects,
  jobs,
  onSave,
  onDelete
}: TrackerEntrySheetProps) {
  const [loading, setLoading] = useState(false);
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectId: "",
      jobId: "",
      description: "",
      startDate: new Date(),
      startTime: "09:00",
      endDate: new Date(),
      endTime: "17:00",
      duration: 0,
      billable: true,
      rate: 150,
      tags: [],
    },
  });

  useEffect(() => {
    if (entry) {
      const startDate = new Date(entry.startTime);
      const endDate = entry.endTime ? new Date(entry.endTime) : new Date();
      
      form.reset({
        projectId: entry.projectId,
        jobId: entry.jobId,
        description: entry.description || "",
        startDate,
        startTime: format(startDate, "HH:mm"),
        endDate,
        endTime: format(endDate, "HH:mm"),
        duration: entry.duration,
        billable: entry.billable,
        rate: entry.rate || 150,
        tags: entry.tags || [],
      });
    } else {
      form.reset({
        projectId: "",
        jobId: "",
        description: "",
        startDate: new Date(),
        startTime: "09:00",
        endDate: new Date(),
        endTime: "17:00",
        duration: 0,
        billable: true,
        rate: 150,
        tags: [],
      });
    }
  }, [entry, form]);

  useEffect(() => {
    const projectId = form.watch("projectId");
    if (projectId) {
      setFilteredJobs(jobs.filter(job => job.projectId === projectId));
    } else {
      setFilteredJobs(jobs);
    }
  }, [form.watch("projectId"), jobs]);

  useEffect(() => {
    // Calculate duration when dates/times change
    const startDate = form.watch("startDate");
    const startTime = form.watch("startTime");
    const endDate = form.watch("endDate");
    const endTime = form.watch("endTime");

    if (startDate && startTime && endDate && endTime) {
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      
      const start = new Date(startDate);
      start.setHours(startHours, startMinutes, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(endHours, endMinutes, 0, 0);
      
      const duration = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
      form.setValue("duration", duration);
    }
  }, [
    form.watch("startDate"),
    form.watch("startTime"),
    form.watch("endDate"),
    form.watch("endTime")
  ]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      
      const [startHours, startMinutes] = data.startTime.split(":").map(Number);
      const [endHours, endMinutes] = data.endTime.split(":").map(Number);
      
      const startTime = new Date(data.startDate);
      startTime.setHours(startHours, startMinutes, 0, 0);
      
      const endTime = new Date(data.endDate);
      endTime.setHours(endHours, endMinutes, 0, 0);

      await onSave({
        projectId: data.projectId,
        jobId: data.jobId,
        description: data.description,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: data.duration,
        billable: data.billable,
        rate: data.billable ? data.rate : undefined,
        tags: data.tags,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save entry:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        setLoading(true);
        await onDelete();
        onOpenChange(false);
      } catch (error) {
        console.error("Failed to delete entry:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {entry ? "Edit Time Entry" : "New Time Entry"}
          </SheetTitle>
          <SheetDescription>
            {entry ? "Update the details of this time entry" : "Create a new time entry"}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Project and Job */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
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
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredJobs.map(job => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.number} - {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What did you work on?" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Date and Time */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Date & Time</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
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
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
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
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Duration Display */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Duration:</span>
                <span className="font-semibold">
                  {formatDuration(form.watch("duration"))}
                </span>
              </div>
            </div>

            <Separator />

            {/* Billing */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Billing</h4>
              
              <FormField
                control={form.control}
                name="billable"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Billable</FormLabel>
                      <FormDescription>
                        Mark this time as billable to the client
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("billable") && (
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            $
                          </span>
                          <Input 
                            type="number" 
                            className="pl-8"
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Total: ${((form.watch("duration") / 3600) * (field.value || 0)).toFixed(2)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Tags</h4>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(form.watch("tags") || []).map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      className="ml-2 hover:text-destructive"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <SheetFooter className="flex gap-2 sm:gap-0">
              {entry && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : entry ? "Update" : "Create"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}