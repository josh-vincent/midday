"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@midday/ui/select";
import { Calendar } from "@midday/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@midday/ui/popover";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  Edit, 
  Trash, 
  Clock,
  Calendar as CalendarIcon,
  DollarSign,
  Tag,
  Briefcase,
  User,
  Save,
  PlayCircle,
  CheckCircle,
  XCircle,
  Timer,
  Copy,
  FileText
} from "lucide-react";
import type { MockTimeEntry } from "@/lib/mock/time-mock";

type Props = {
  entry: MockTimeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: Partial<MockTimeEntry>) => void;
  onDelete?: (entry: MockTimeEntry) => void;
  onDuplicate?: (entry: MockTimeEntry) => void;
  onStartTimer?: (data: { description: string; projectId?: string; jobId?: string }) => void;
};

const statusConfig = {
  running: { 
    label: "Running", 
    variant: "default" as const,
    icon: PlayCircle,
    color: "text-green-500"
  },
  paused: { 
    label: "Paused", 
    variant: "secondary" as const,
    icon: Timer,
    color: "text-yellow-500"
  },
  stopped: { 
    label: "Stopped", 
    variant: "outline" as const,
    icon: CheckCircle,
    color: "text-gray-500"
  },
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}m`;
}

export function TimeEntrySheet({ 
  entry, 
  open, 
  onOpenChange, 
  onSave, 
  onDelete,
  onDuplicate,
  onStartTimer 
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("");
  const [billable, setBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState("100");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (entry) {
      setDescription(entry.description);
      setDate(new Date(entry.date));
      setStartTime(format(new Date(entry.startTime), "HH:mm"));
      setEndTime(entry.endTime ? format(new Date(entry.endTime), "HH:mm") : "");
      setProjectId(entry.projectId || "");
      setClientId(entry.clientId);
      setBillable(entry.billable);
      setHourlyRate(entry.hourlyRate.toString());
      setNotes(entry.notes || "");
      setTags(entry.tags?.join(", ") || "");
    }
  }, [entry]);

  const calculateDuration = () => {
    if (!startTime || !endTime || !entry) return entry?.duration || 0;
    
    const start = new Date(`${format(date, 'yyyy-MM-dd')}T${startTime}`);
    const end = new Date(`${format(date, 'yyyy-MM-dd')}T${endTime}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const handleSave = () => {
    if (!entry || !onSave) return;

    const duration = calculateDuration();
    const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${startTime}`);
    const endDateTime = endTime ? new Date(`${format(date, 'yyyy-MM-dd')}T${endTime}`) : undefined;

    onSave({
      description: description.trim(),
      date: format(date, 'yyyy-MM-dd'),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime?.toISOString(),
      duration,
      projectId: projectId || undefined,
      clientId,
      billable,
      hourlyRate: parseFloat(hourlyRate) || 100,
      notes: notes.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    });

    setIsEditing(false);
  };

  const handleDuplicate = () => {
    if (!entry || !onDuplicate) return;
    onDuplicate(entry);
  };

  const handleStartTimer = () => {
    if (!entry || !onStartTimer) return;
    onStartTimer({
      description: entry.description,
      projectId: entry.projectId,
      jobId: entry.jobId,
    });
  };

  if (!entry) return null;

  const statusInfo = statusConfig[entry.status];
  const StatusIcon = statusInfo.icon;
  const revenue = entry.billable ? (entry.duration / 60) * entry.hourlyRate : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Time Entry Details</SheetTitle>
              <SheetDescription>
                {format(new Date(entry.date), "EEEE, MMMM dd, yyyy")}
              </SheetDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={statusInfo.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="edit">Edit</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              {/* Summary */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{entry.description}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(entry.duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      {format(new Date(entry.startTime), "HH:mm")}
                      {entry.endTime && ` - ${format(new Date(entry.endTime), "HH:mm")}`}
                    </div>
                    {entry.billable && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${revenue.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Project & Client */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Client</Label>
                    <div className="font-medium">{entry.clientName}</div>
                  </div>
                  {entry.projectName && (
                    <div>
                      <Label className="text-muted-foreground">Project</Label>
                      <div className="font-medium flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {entry.projectName}
                      </div>
                    </div>
                  )}
                </div>

                {/* Job */}
                {entry.jobName && (
                  <div>
                    <Label className="text-muted-foreground">Job</Label>
                    <div className="font-medium">{entry.jobName}</div>
                  </div>
                )}

                {/* Billing Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Billing Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {entry.billable ? (
                        <Badge variant="default" className="gap-1">
                          <DollarSign className="h-3 w-3" />
                          Billable
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Non-billable
                        </Badge>
                      )}
                      
                      {entry.billed && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Billed
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {entry.billable && (
                    <div>
                      <Label className="text-muted-foreground">Hourly Rate</Label>
                      <div className="font-medium">${entry.hourlyRate}/hour</div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {entry.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <div className="mt-1 p-3 bg-muted rounded-md text-sm">
                      {entry.notes}
                    </div>
                  </div>
                )}

                {/* User */}
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{entry.userName}</span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Created: {format(new Date(entry.createdAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                  <div>Updated: {format(new Date(entry.updatedAt), "MMM dd, yyyy 'at' HH:mm")}</div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsEditing(true)} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                <Button onClick={handleDuplicate} size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                
                {entry.status === "stopped" && (
                  <Button onClick={handleStartTimer} size="sm" variant="outline">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                )}
                
                <Button 
                  onClick={() => onDelete?.(entry)} 
                  size="sm" 
                  variant="destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="space-y-4">
              {/* Edit Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-start-time">Start Time</Label>
                    <Input
                      id="edit-start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-end-time">End Time</Label>
                    <Input
                      id="edit-end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No project</SelectItem>
                      <SelectItem value="proj_1">Website Redesign</SelectItem>
                      <SelectItem value="proj_2">Mobile App</SelectItem>
                      <SelectItem value="proj_3">Marketing Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client_1">Acme Corporation</SelectItem>
                      <SelectItem value="client_2">TechStart Inc</SelectItem>
                      <SelectItem value="client_3">Global Services Ltd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-billable"
                    checked={billable}
                    onCheckedChange={setBillable}
                  />
                  <Label htmlFor="edit-billable">Billable</Label>
                </div>

                {billable && (
                  <div>
                    <Label htmlFor="edit-rate">Hourly Rate ($)</Label>
                    <Input
                      id="edit-rate"
                      type="number"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="edit-tags">Tags</Label>
                  <Input
                    id="edit-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="development, meeting, research"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Duration Display */}
                {startTime && endTime && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      Duration: {formatDuration(calculateDuration())}
                    </span>
                    {billable && (
                      <span className="text-sm text-muted-foreground">
                        • ${((calculateDuration() / 60) * parseFloat(hourlyRate)).toFixed(2)} revenue
                      </span>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    onClick={() => setIsEditing(false)} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}