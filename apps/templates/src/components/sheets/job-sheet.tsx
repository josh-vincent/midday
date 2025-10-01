"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Separator } from "@midday/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { format } from "date-fns";
import { 
  Edit, 
  Trash, 
  Play,
  Pause,
  CheckCircle,
  Timer,
  Calendar,
  User,
  Briefcase,
  MessageSquare,
  Clock,
  Target,
  AlertTriangle,
  TrendingUp,
  PauseCircle,
  XCircle,
  DollarSign,
  FileText,
  Users,
  MapPin,
  Mail,
  Phone
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockJob } from "@/lib/mock/jobs-mock";

type Props = {
  job: MockJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (job: MockJob) => void;
  onDelete?: (job: MockJob) => void;
  onStart?: (job: MockJob) => void;
  onComplete?: (job: MockJob) => void;
  onTimeTracker?: (job: MockJob) => void;
};

export function JobSheet({ 
  job, 
  open, 
  onOpenChange,
  onEdit,
  onDelete,
  onStart,
  onComplete,
  onTimeTracker,
}: Props) {
  if (!job) return null;

  const statusConfig = {
    pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
    in_progress: { label: "In Progress", variant: "default" as const, icon: TrendingUp },
    completed: { label: "Completed", variant: "default" as const, icon: CheckCircle },
    on_hold: { label: "On Hold", variant: "secondary" as const, icon: PauseCircle },
    overdue: { label: "Overdue", variant: "destructive" as const, icon: AlertTriangle },
    cancelled: { label: "Cancelled", variant: "outline" as const, icon: XCircle },
  };

  const priorityConfig = {
    low: { label: "Low", variant: "secondary" as const, icon: Target },
    medium: { label: "Medium", variant: "secondary" as const, icon: Target },
    high: { label: "High", variant: "secondary" as const, icon: AlertTriangle },
    urgent: { label: "Urgent", variant: "destructive" as const, icon: AlertTriangle },
  };

  const status = statusConfig[job.status];
  const priority = priorityConfig[job.priority];
  const StatusIcon = status.icon;
  const PriorityIcon = priority.icon;

  const isOverdue = job.dueDate && new Date(job.dueDate) < new Date() && job.status !== "completed";
  const canStart = job.status === "pending" || job.status === "on_hold";
  const canComplete = ["in_progress", "pending"].includes(job.status);
  const canTimeTrack = job.status === "in_progress";

  const totalValue = job.estimatedHours * job.hourlyRate;
  const actualValue = job.actualHours * job.hourlyRate;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[700px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{job.title}</SheetTitle>
          <SheetDescription>
            View and manage job details and progress
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant={status.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                <Badge variant={priority.variant} className="gap-1">
                  <PriorityIcon className="h-3 w-3" />
                  {priority.label}
                </Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ${totalValue.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Est. value
                </div>
              </div>
            </div>

            {isOverdue && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  This job is overdue and needs immediate attention
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{job.progress}%</span>
              </div>
              <Progress value={job.progress} className="h-2" />
            </div>
          </div>

          <Separator />

          {/* Project and Client Info */}
          <div className="grid grid-cols-2 gap-4">
            {job.projectName && (
              <div className="flex items-start space-x-3">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Project</p>
                  <p className="text-sm text-muted-foreground">{job.projectName}</p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Client</p>
                <p className="text-sm text-muted-foreground">{job.client.name}</p>
              </div>
            </div>
          </div>

          {/* Assignee */}
          <div className="flex items-start space-x-3">
            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Assignee</p>
              {job.assignee ? (
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={job.assignee.avatar} alt={job.assignee.name} />
                    <AvatarFallback className="text-xs">
                      {job.assignee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{job.assignee.name}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            {job.startDate && (
              <div className="flex items-start space-x-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Start Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(job.startDate), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            )}

            {job.dueDate && (
              <div className="flex items-start space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Due Date</p>
                  <p className={cn(
                    "text-sm",
                    isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                  )}>
                    {format(new Date(job.dueDate), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Time and Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Time Tracking</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated:</span>
                  <span>{job.estimatedHours}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual:</span>
                  <span className={cn(
                    job.actualHours > job.estimatedHours ? "text-red-600" : "text-green-600"
                  )}>
                    {job.actualHours.toFixed(1)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span>${job.hourlyRate}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Budget</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated:</span>
                  <span>${totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual:</span>
                  <span className={cn(
                    actualValue > totalValue ? "text-red-600" : "text-green-600"
                  )}>
                    ${actualValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Difference:</span>
                  <span className={cn(
                    actualValue > totalValue ? "text-red-600" : "text-green-600"
                  )}>
                    {actualValue > totalValue ? "+" : ""}${(actualValue - totalValue).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Description</p>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  {job.description}
                </p>
              </div>
            </>
          )}

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {job.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tabs for detailed content */}
          <Tabs defaultValue="time" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="time">Time Entries</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="time" className="space-y-3">
              {job.timeEntries && job.timeEntries.length > 0 ? (
                job.timeEntries.map((entry) => (
                  <div key={entry.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {entry.hours.toFixed(1)}h
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No time entries recorded yet.</p>
              )}
            </TabsContent>
            
            <TabsContent value="milestones" className="space-y-3">
              {job.milestones && job.milestones.length > 0 ? (
                job.milestones.map((milestone) => (
                  <div key={milestone.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        {milestone.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{milestone.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Due: {format(new Date(milestone.dueDate), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <Badge variant={milestone.completed ? "default" : "secondary"}>
                        {milestone.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No milestones defined.</p>
              )}
            </TabsContent>
            
            <TabsContent value="comments" className="space-y-3">
              {job.comments && job.comments.length > 0 ? (
                job.comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-medium">{comment.author}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              )}
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit?.(job);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              
              {canStart && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onStart?.(job);
                    onOpenChange(false);
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              )}
              
              {canComplete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onComplete?.(job);
                    onOpenChange(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              )}
              
              {canTimeTrack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onTimeTracker?.(job);
                    onOpenChange(false);
                  }}
                >
                  <Timer className="h-4 w-4 mr-2" />
                  Time Tracker
                </Button>
              )}
            </div>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete?.(job);
                onOpenChange(false);
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}