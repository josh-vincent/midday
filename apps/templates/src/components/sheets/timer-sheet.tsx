"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { Card, CardContent } from "@midday/ui/card";
import { 
  PlayCircle, 
  Timer,
  Briefcase,
  Users,
  Clock,
  Zap,
  Coffee,
  Code,
  FileText,
  Lightbulb,
  X
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (data: { description: string; projectId?: string; jobId?: string }) => void;
};

const quickTemplates = [
  { 
    icon: Code, 
    name: "Development", 
    description: "Working on development tasks",
    color: "bg-blue-500"
  },
  { 
    icon: FileText, 
    name: "Documentation", 
    description: "Writing documentation",
    color: "bg-green-500"
  },
  { 
    icon: Users, 
    name: "Meeting", 
    description: "Team meeting or client call",
    color: "bg-purple-500"
  },
  { 
    icon: Lightbulb, 
    name: "Research", 
    description: "Research and planning",
    color: "bg-yellow-500"
  },
  { 
    icon: Coffee, 
    name: "Break", 
    description: "Taking a break",
    color: "bg-orange-500"
  },
  { 
    icon: Zap, 
    name: "Bug Fix", 
    description: "Fixing bugs and issues",
    color: "bg-red-500"
  },
];

export function TimerSheet({ open, onOpenChange, onStart }: Props) {
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [jobId, setJobId] = useState("");
  const [notes, setNotes] = useState("");

  const handleStart = () => {
    if (!description.trim()) return;

    onStart({
      description: description.trim(),
      projectId: projectId || undefined,
      jobId: jobId || undefined,
    });

    // Reset form
    setDescription("");
    setProjectId("");
    setJobId("");
    setNotes("");
    onOpenChange(false);
  };

  const handleTemplateSelect = (template: typeof quickTemplates[0]) => {
    setDescription(template.description);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Start Timer
              </SheetTitle>
              <SheetDescription>
                Start tracking time for a new task or activity
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Quick Templates */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Quick Start Templates</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card
                    key={template.name}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${template.color} text-white`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Timer Configuration Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">What are you working on? *</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                onKeyDown={handleKeyPress}
                autoFocus
              />
            </div>

            <div>
              <Label>Project (Optional)</Label>
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
                  <SelectItem value="proj_2">Mobile App Development</SelectItem>
                  <SelectItem value="proj_3">Marketing Campaign</SelectItem>
                  <SelectItem value="proj_4">E-commerce Platform</SelectItem>
                  <SelectItem value="proj_5">CRM Implementation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Job/Task (Optional)</Label>
              <Select value={jobId} onValueChange={setJobId} disabled={!projectId}>
                <SelectTrigger>
                  <SelectValue placeholder={projectId ? "Select job" : "Select project first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific job</SelectItem>
                  <SelectItem value="job_1">Frontend Development</SelectItem>
                  <SelectItem value="job_2">Backend API Integration</SelectItem>
                  <SelectItem value="job_3">UI/UX Design</SelectItem>
                  <SelectItem value="job_4">Testing & QA</SelectItem>
                  <SelectItem value="job_5">Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this task..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Timer Preview */}
          {description && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Ready to start</span>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium">{description}</div>
                {projectId && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Project selected
                  </div>
                )}
                {jobId && (
                  <div className="text-sm text-muted-foreground">
                    Job selected
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘/Ctrl + Enter</kbd> to start
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStart}
                disabled={!description.trim()}
                className="gap-2"
              >
                <PlayCircle className="h-4 w-4" />
                Start Timer
              </Button>
            </div>
          </div>

          {/* Recent Descriptions */}
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-2 block">Recent Activities</Label>
            <div className="space-y-1">
              {[
                "Working on user authentication",
                "Code review and testing", 
                "Client meeting preparation",
                "Bug fixes and optimizations"
              ].map((recentDesc, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => setDescription(recentDesc)}
                >
                  <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                  <span className="text-sm">{recentDesc}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}