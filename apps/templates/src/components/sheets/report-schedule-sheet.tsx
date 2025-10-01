"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Textarea } from "@midday/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { ScrollArea } from "@midday/ui/scroll-area";
import { 
  Calendar, 
  Clock, 
  Mail,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import type { MockReport } from "@/lib/mock/reports-mock";

type Props = {
  report: MockReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (reportId: string, schedule: string, recipients: string[]) => void;
};

const scheduleOptions = [
  { value: "0 9 * * 1", label: "Weekly (Mondays at 9 AM)" },
  { value: "0 9 1 * *", label: "Monthly (1st at 9 AM)" },
  { value: "0 9 1 */3 *", label: "Quarterly (1st at 9 AM)" },
  { value: "0 9 1 1 *", label: "Yearly (Jan 1st at 9 AM)" },
  { value: "0 9 * * *", label: "Daily (9 AM)" },
  { value: "custom", label: "Custom Schedule" },
];

const timeZones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
];

export function ReportScheduleSheet({ 
  report, 
  open, 
  onOpenChange,
  onSchedule,
}: Props) {
  const [formData, setFormData] = useState({
    enabled: false,
    schedule: "0 9 1 * *", // Monthly by default
    customSchedule: "",
    timeZone: "UTC",
    recipients: [] as string[],
    subject: "",
    message: "",
  });

  const [newRecipient, setNewRecipient] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (report && open) {
      setFormData({
        enabled: report.scheduled,
        schedule: "0 9 1 * *",
        customSchedule: "",
        timeZone: "UTC",
        recipients: [...report.recipients],
        subject: `Scheduled Report: ${report.name}`,
        message: `Please find the attached ${report.name} report.\n\nThis report covers the period from ${new Date(report.dateRange.from).toLocaleDateString()} to ${new Date(report.dateRange.to).toLocaleDateString()}.\n\nBest regards,\nReporting System`,
      });
      setErrors({});
    }
  }, [report, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.schedule && !formData.customSchedule) {
      newErrors.schedule = "Please select a schedule";
    }

    if (formData.schedule === "custom" && !formData.customSchedule.trim()) {
      newErrors.customSchedule = "Please enter a custom cron expression";
    }

    if (formData.recipients.length === 0) {
      newErrors.recipients = "At least one recipient is required";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!report || !validateForm()) return;

    const schedule = formData.schedule === "custom" ? formData.customSchedule : formData.schedule;
    onSchedule(report.id, schedule, formData.recipients);
  };

  const addRecipient = () => {
    if (newRecipient && !formData.recipients.includes(newRecipient)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(newRecipient)) {
        setFormData(prev => ({
          ...prev,
          recipients: [...prev.recipients, newRecipient],
        }));
        setNewRecipient("");
        setErrors(prev => ({ ...prev, recipients: "" }));
      } else {
        setErrors(prev => ({ ...prev, newRecipient: "Please enter a valid email address" }));
      }
    }
  };

  const removeRecipient = (email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email),
    }));
  };

  const getScheduleDescription = () => {
    const option = scheduleOptions.find(opt => opt.value === formData.schedule);
    return option?.label || "Custom schedule";
  };

  if (!report) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Schedule Report</span>
          </SheetTitle>
          <SheetDescription>
            Configure automatic report generation and delivery
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-6">
          <form onSubmit={handleSubmit} className="space-y-6 py-6">
            {/* Report Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{report.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <Badge variant="outline">{report.type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <Badge variant="outline">{report.format.toUpperCase()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Status:</span>
                  <div className="flex items-center space-x-2">
                    {report.scheduled ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">Scheduled</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-yellow-600">Not Scheduled</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enable Scheduling */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, enabled: !!checked }))
                }
              />
              <Label htmlFor="enabled" className="text-base font-medium">
                Enable automatic report scheduling
              </Label>
            </div>

            {formData.enabled && (
              <>
                <Separator />

                {/* Schedule Configuration */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Schedule Configuration</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <Label>Schedule Frequency</Label>
                    <Select
                      value={formData.schedule}
                      onValueChange={(value) => {
                        setFormData(prev => ({ ...prev, schedule: value }));
                        setErrors(prev => ({ ...prev, schedule: "" }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        {scheduleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.schedule && (
                      <p className="text-sm text-red-600">{errors.schedule}</p>
                    )}
                  </div>

                  {formData.schedule === "custom" && (
                    <div className="space-y-3">
                      <Label>Custom Cron Expression</Label>
                      <Input
                        placeholder="e.g., 0 9 * * 1 (every Monday at 9 AM)"
                        value={formData.customSchedule}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, customSchedule: e.target.value }));
                          setErrors(prev => ({ ...prev, customSchedule: "" }));
                        }}
                      />
                      {errors.customSchedule && (
                        <p className="text-sm text-red-600">{errors.customSchedule}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Use cron format: minute hour day month weekday
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Time Zone</Label>
                    <Select
                      value={formData.timeZone}
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, timeZone: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeZones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <strong>Schedule:</strong> {getScheduleDescription()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Time Zone:</strong> {formData.timeZone}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Recipients */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Email Recipients</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Enter email address"
                          value={newRecipient}
                          onChange={(e) => {
                            setNewRecipient(e.target.value);
                            setErrors(prev => ({ ...prev, newRecipient: "" }));
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                        />
                        {errors.newRecipient && (
                          <p className="text-sm text-red-600 mt-1">{errors.newRecipient}</p>
                        )}
                      </div>
                      <Button type="button" onClick={addRecipient}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {errors.recipients && (
                      <p className="text-sm text-red-600">{errors.recipients}</p>
                    )}
                    
                    {formData.recipients.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">Current Recipients</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.recipients.map((email) => (
                            <Badge key={email} variant="secondary" className="flex items-center space-x-1">
                              <span>{email}</span>
                              <button
                                type="button"
                                onClick={() => removeRecipient(email)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Email Template */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Email Template</h3>
                  
                  <div className="space-y-3">
                    <Label>Subject Line</Label>
                    <Input
                      placeholder="Email subject"
                      value={formData.subject}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, subject: e.target.value }));
                        setErrors(prev => ({ ...prev, subject: "" }));
                      }}
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-600">{errors.subject}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Email message body"
                      value={formData.message}
                      onChange={(e) => 
                        setFormData(prev => ({ ...prev, message: e.target.value }))
                      }
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      The report will be attached to this email automatically.
                    </p>
                  </div>
                </div>
              </>
            )}
          </form>
        </ScrollArea>

        {/* Actions */}
        <div className="border-t pt-4 space-y-2">
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!formData.enabled}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {formData.enabled ? "Save Schedule" : "Enable Scheduling"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}