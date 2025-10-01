"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Checkbox } from "@midday/ui/checkbox";
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
  Plus, 
  X, 
  Clock, 
  Calendar as CalendarIcon,
  DollarSign,
  Tag,
  Briefcase
} from "lucide-react";
import type { MockTimeEntry } from "@/lib/mock/time-mock";

type Props = {
  onSubmit: (data: Partial<MockTimeEntry>) => void;
  onCancel: () => void;
};

export function QuickEntry({ onSubmit, onCancel }: Props) {
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(format(new Date(), "HH:mm"));
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");
  const [projectId, setProjectId] = useState("");
  const [clientId, setClientId] = useState("client_1");
  const [billable, setBillable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState("100");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [isDurationMode, setIsDurationMode] = useState(false);

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`${format(date, 'yyyy-MM-dd')}T${startTime}`);
    const end = new Date(`${format(date, 'yyyy-MM-dd')}T${endTime}`);
    
    if (end < start) {
      // Handle next day case
      end.setDate(end.getDate() + 1);
    }
    
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const calculateEndTime = (durationMinutes: number) => {
    if (!startTime) return "";
    
    const start = new Date(`${format(date, 'yyyy-MM-dd')}T${startTime}`);
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    
    return format(end, "HH:mm");
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    
    // Parse duration (supports formats like "2h", "90m", "2h 30m", "2.5")
    let minutes = 0;
    const hours = value.match(/(\d+(?:\.\d+)?)\s*h/);
    const mins = value.match(/(\d+)\s*m/);
    const decimal = value.match(/^(\d+(?:\.\d+)?)$/);
    
    if (hours) minutes += parseFloat(hours[1]) * 60;
    if (mins) minutes += parseInt(mins[1]);
    if (decimal && !hours && !mins) minutes = parseFloat(decimal[1]) * 60;
    
    if (minutes > 0 && startTime) {
      setEndTime(calculateEndTime(minutes));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) return;
    
    const finalDuration = isDurationMode && duration 
      ? (() => {
          let minutes = 0;
          const hours = duration.match(/(\d+(?:\.\d+)?)\s*h/);
          const mins = duration.match(/(\d+)\s*m/);
          const decimal = duration.match(/^(\d+(?:\.\d+)?)$/);
          
          if (hours) minutes += parseFloat(hours[1]) * 60;
          if (mins) minutes += parseInt(mins[1]);
          if (decimal && !hours && !mins) minutes = parseFloat(decimal[1]) * 60;
          
          return minutes;
        })()
      : calculateDuration();

    const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${startTime}`);
    const endDateTime = isDurationMode && duration
      ? new Date(startDateTime.getTime() + finalDuration * 60 * 1000)
      : endTime ? new Date(`${format(date, 'yyyy-MM-dd')}T${endTime}`) : undefined;

    const data: Partial<MockTimeEntry> = {
      description: description.trim(),
      date: format(date, 'yyyy-MM-dd'),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime?.toISOString(),
      duration: finalDuration,
      projectId: projectId || undefined,
      clientId,
      clientName: "Default Client", // This would come from actual client data
      billable,
      hourlyRate: parseFloat(hourlyRate) || 100,
      notes: notes.trim() || undefined,
      tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      userId: "user_1",
      userName: "Current User",
    };

    onSubmit(data);
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Time Entry
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                required
              />
            </div>

            {/* Date */}
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

            {/* Duration Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="duration-mode"
                checked={isDurationMode}
                onCheckedChange={setIsDurationMode}
              />
              <Label htmlFor="duration-mode" className="text-sm">
                Enter duration instead of times
              </Label>
            </div>

            {/* Time Inputs */}
            {isDurationMode ? (
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  placeholder="e.g., 2h 30m, 1.5h, 90m"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formats: 2h 30m, 1.5h, 90m, or 1.5
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Project */}
            <div>
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <SelectValue placeholder="Select project" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  <SelectItem value="proj_1">Website Redesign</SelectItem>
                  <SelectItem value="proj_2">Mobile App</SelectItem>
                  <SelectItem value="proj_3">Marketing Campaign</SelectItem>
                  <SelectItem value="proj_4">E-commerce Platform</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client */}
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
                  <SelectItem value="client_4">Digital Agency Co</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Billable */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="billable"
                checked={billable}
                onCheckedChange={setBillable}
              />
              <Label htmlFor="billable" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Billable
              </Label>
            </div>

            {/* Hourly Rate */}
            {billable && (
              <div>
                <Label htmlFor="rate">Hourly Rate ($)</Label>
                <Input
                  id="rate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="development, meeting, research"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Separate with commas
              </p>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this time entry..."
                rows={3}
              />
            </div>
          </div>

          {/* Duration Display */}
          {((!isDurationMode && startTime && endTime) || (isDurationMode && duration)) && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                Duration: {
                  isDurationMode 
                    ? duration
                    : (() => {
                        const mins = calculateDuration();
                        const hours = Math.floor(mins / 60);
                        const remainingMins = mins % 60;
                        return hours > 0 
                          ? `${hours}h ${remainingMins}m`
                          : `${remainingMins}m`;
                      })()
                }
              </span>
              {billable && (
                <span className="text-sm text-muted-foreground">
                  • ${(
                    (isDurationMode 
                      ? (() => {
                          let minutes = 0;
                          const hours = duration.match(/(\d+(?:\.\d+)?)\s*h/);
                          const mins = duration.match(/(\d+)\s*m/);
                          const decimal = duration.match(/^(\d+(?:\.\d+)?)$/);
                          
                          if (hours) minutes += parseFloat(hours[1]) * 60;
                          if (mins) minutes += parseInt(mins[1]);
                          if (decimal && !hours && !mins) minutes = parseFloat(decimal[1]) * 60;
                          
                          return minutes;
                        })()
                      : calculateDuration()
                    ) / 60 * parseFloat(hourlyRate)
                  ).toFixed(2)} revenue
                </span>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!description.trim()}>
              Add Entry
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}