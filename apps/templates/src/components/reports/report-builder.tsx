"use client";

import { useState } from "react";
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
import { Calendar } from "@midday/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@midday/ui/popover";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  Plus, 
  FileText, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Calendar as CalendarIcon,
  Settings,
  X
} from "lucide-react";
import type { MockReport } from "@/lib/mock/reports-mock";

type Props = {
  onCreateReport: (report: Partial<MockReport>) => void;
  compact?: boolean;
};

const reportTypes = [
  { value: "revenue", label: "Revenue Report", icon: TrendingUp },
  { value: "expenses", label: "Expense Report", icon: PieChart },
  { value: "profit-loss", label: "Profit & Loss", icon: BarChart3 },
  { value: "cashflow", label: "Cash Flow", icon: BarChart3 },
  { value: "client", label: "Client Analysis", icon: FileText },
  { value: "project", label: "Project Report", icon: FileText },
  { value: "time", label: "Time Analysis", icon: FileText },
];

const frequencies = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" },
];

const formats = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "csv", label: "CSV" },
];

const categories = [
  "Software & Tools",
  "Salaries & Wages", 
  "Marketing",
  "Office Supplies",
  "Travel",
  "Entertainment",
  "Utilities",
  "Rent",
  "Insurance",
  "Taxes",
  "Consulting",
  "Equipment",
];

const clients = [
  "Acme Corp",
  "TechStart Inc",
  "Global Solutions",
  "Innovation Labs",
  "Digital Ventures",
  "Future Systems",
];

const projects = [
  "Website Redesign",
  "Mobile App",
  "CRM Integration", 
  "Data Migration",
  "API Development",
  "E-commerce Platform",
];

export function ReportBuilder({ onCreateReport, compact = false }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    frequency: "monthly",
    format: "pdf",
    scheduled: false,
    recipients: [] as string[],
    filters: {
      categories: [] as string[],
      clients: [] as string[],
      projects: [] as string[],
      dateRange: {
        from: new Date(new Date().getFullYear(), 0, 1).toISOString(),
        to: new Date().toISOString(),
      },
    },
  });

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [newRecipient, setNewRecipient] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const report: Partial<MockReport> = {
      name: formData.name,
      type: formData.type as any,
      frequency: formData.frequency as any,
      format: formData.format as any,
      scheduled: formData.scheduled,
      recipients: formData.recipients,
      filters: {
        ...formData.filters,
        dateRange: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
      },
      dateRange: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      },
    };

    onCreateReport(report);
    
    // Reset form
    setFormData({
      name: "",
      type: "",
      frequency: "monthly",
      format: "pdf",
      scheduled: false,
      recipients: [],
      filters: {
        categories: [],
        clients: [],
        projects: [],
        dateRange: {
          from: new Date(new Date().getFullYear(), 0, 1).toISOString(),
          to: new Date().toISOString(),
        },
      },
    });
  };

  const addRecipient = () => {
    if (newRecipient && !formData.recipients.includes(newRecipient)) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient],
      }));
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email),
    }));
  };

  const toggleFilter = (type: 'categories' | 'clients' | 'projects', value: string) => {
    setFormData(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [type]: prev.filters[type].includes(value)
          ? prev.filters[type].filter(item => item !== value)
          : [...prev.filters[type], value],
      },
    }));
  };

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Quick Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quick-name">Report Name</Label>
            <Input
              id="quick-name"
              placeholder="Enter report name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div>
            <Label>Report Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Format</Label>
            <Select
              value={formData.format}
              onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!formData.name || !formData.type}
          >
            Generate Report
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Report Builder</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div>
              <Label htmlFor="name">Report Name</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Revenue Report"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Report Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Format</Label>
              <Select
                value={formData.format}
                onValueChange={(value) => setFormData(prev => ({ ...prev, format: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formats.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Date Range</h3>
            
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{
                    from: dateRange?.from,
                    to: dateRange?.to,
                  }}
                  onSelect={(range: any) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: range.to });
                      setDatePickerOpen(false);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Filters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Filters</h3>
            
            <div className="space-y-3">
              <Label>Categories</Label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={formData.filters.categories.includes(category)}
                      onCheckedChange={() => toggleFilter('categories', category)}
                    />
                    <Label 
                      htmlFor={`category-${category}`}
                      className="text-sm"
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Clients</Label>
              <div className="grid grid-cols-2 gap-2">
                {clients.map((client) => (
                  <div key={client} className="flex items-center space-x-2">
                    <Checkbox
                      id={`client-${client}`}
                      checked={formData.filters.clients.includes(client)}
                      onCheckedChange={() => toggleFilter('clients', client)}
                    />
                    <Label 
                      htmlFor={`client-${client}`}
                      className="text-sm"
                    >
                      {client}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Projects</Label>
              <div className="grid grid-cols-2 gap-2">
                {projects.map((project) => (
                  <div key={project} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project}`}
                      checked={formData.filters.projects.includes(project)}
                      onCheckedChange={() => toggleFilter('projects', project)}
                    />
                    <Label 
                      htmlFor={`project-${project}`}
                      className="text-sm"
                    >
                      {project}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Scheduling & Recipients */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Scheduling & Distribution</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="scheduled"
                checked={formData.scheduled}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, scheduled: !!checked }))
                }
              />
              <Label htmlFor="scheduled">Schedule this report</Label>
            </div>

            <div className="space-y-3">
              <Label>Recipients</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter email address"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())}
                />
                <Button type="button" onClick={addRecipient}>
                  Add
                </Button>
              </div>
              
              {formData.recipients.length > 0 && (
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
              )}
            </div>
          </div>

          <Separator />

          <Button 
            type="submit" 
            className="w-full"
            disabled={!formData.name || !formData.type}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}