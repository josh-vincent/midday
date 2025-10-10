"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import { cn } from "@midday/ui/cn";
import {
  Folder,
  FolderOpen,
  FileText,
  BarChart3,
  Megaphone,
  Users,
  Scale,
  Calendar,
  Target,
  Briefcase,
  Settings,
  Home,
  Archive,
} from "lucide-react";
import type { MockFolder } from "@/lib/mock/documents-mock";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateFolderData) => void;
  parentFolder?: MockFolder;
};

type CreateFolderData = {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
};

const folderColors = [
  { value: "#3b82f6", label: "Blue", class: "bg-blue-500" },
  { value: "#10b981", label: "Green", class: "bg-green-500" },
  { value: "#f59e0b", label: "Yellow", class: "bg-yellow-500" },
  { value: "#ef4444", label: "Red", class: "bg-red-500" },
  { value: "#8b5cf6", label: "Purple", class: "bg-purple-500" },
  { value: "#06b6d4", label: "Cyan", class: "bg-cyan-500" },
  { value: "#ec4899", label: "Pink", class: "bg-pink-500" },
  { value: "#84cc16", label: "Lime", class: "bg-lime-500" },
  { value: "#f97316", label: "Orange", class: "bg-orange-500" },
  { value: "#6b7280", label: "Gray", class: "bg-gray-500" },
];

const folderIcons = [
  { value: "Folder", label: "Default", icon: Folder },
  { value: "FileText", label: "Documents", icon: FileText },
  { value: "BarChart3", label: "Reports", icon: BarChart3 },
  { value: "Megaphone", label: "Marketing", icon: Megaphone },
  { value: "Users", label: "Team", icon: Users },
  { value: "Scale", label: "Legal", icon: Scale },
  { value: "Calendar", label: "Calendar", icon: Calendar },
  { value: "Target", label: "Goals", icon: Target },
  { value: "Briefcase", label: "Business", icon: Briefcase },
  { value: "Settings", label: "Settings", icon: Settings },
  { value: "Home", label: "Home", icon: Home },
  { value: "Archive", label: "Archive", icon: Archive },
];

export function FolderCreateSheet({
  open,
  onOpenChange,
  onCreate,
  parentFolder,
}: Props) {
  const [formData, setFormData] = useState<CreateFolderData>({
    name: "",
    description: "",
    color: "#3b82f6",
    icon: "Folder",
    parentId: parentFolder?.id,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Folder name is required";
    }
    
    if (formData.name.length > 50) {
      newErrors.name = "Folder name must be 50 characters or less";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onCreate({
        ...formData,
        name: formData.name.trim(),
        path: `${parentFolder?.path || ""}/${formData.name.trim()}`,
      });
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        color: "#3b82f6",
        icon: "Folder",
        parentId: parentFolder?.id,
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3b82f6",
      icon: "Folder",
      parentId: parentFolder?.id,
    });
    setErrors({});
    onOpenChange(false);
  };

  const selectedIconComponent = folderIcons.find(icon => icon.value === formData.icon)?.icon || Folder;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Folder</SheetTitle>
          <SheetDescription>
            {parentFolder 
              ? `Create a new folder inside "${parentFolder.name}"`
              : "Create a new folder in the root directory"
            }
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Folder Preview */}
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center space-x-3 p-4 rounded-lg border bg-muted/30">
              <div 
                className="flex items-center justify-center w-12 h-12 rounded-lg"
                style={{ backgroundColor: formData.color }}
              >
                {React.createElement(selectedIconComponent, {
                  className: "h-6 w-6 text-white"
                })}
              </div>
              <div>
                <div className="font-medium">
                  {formData.name || "New Folder"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {parentFolder ? `in ${parentFolder.name}` : "in Root"}
                </div>
              </div>
            </div>
          </div>

          {/* Folder Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Folder Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter folder name..."
              className={cn(errors.name && "border-red-500")}
              maxLength={50}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this folder will contain..."
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {(formData.description?.length || 0)}/200 characters
            </p>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label>Color</Label>
            <RadioGroup
              value={formData.color}
              onValueChange={(color) => setFormData({ ...formData, color })}
              className="flex flex-wrap gap-2"
            >
              {folderColors.map((color) => (
                <div key={color.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={color.value}
                    id={color.value}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={color.value}
                    className={cn(
                      "w-8 h-8 rounded-full cursor-pointer border-2 transition-all",
                      color.class,
                      formData.color === color.value 
                        ? "border-white shadow-lg scale-110" 
                        : "border-transparent hover:scale-105"
                    )}
                    title={color.label}
                  />
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <Label>Icon</Label>
            <div className="grid grid-cols-6 gap-2">
              {folderIcons.map((icon) => {
                const IconComponent = icon.icon;
                return (
                  <button
                    key={icon.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: icon.value })}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg border transition-all hover:bg-muted",
                      formData.icon === icon.value 
                        ? "border-primary bg-primary/10" 
                        : "border-border"
                    )}
                    title={icon.label}
                  >
                    <IconComponent className="h-5 w-5 mb-1" />
                    <span className="text-xs">{icon.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parent Folder Info */}
          {parentFolder && (
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center space-x-2 text-sm">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Creating inside:</span>
                <span className="font-medium">{parentFolder.name}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Create Folder
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}