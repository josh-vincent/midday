"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@midday/ui/checkbox";
import { Badge } from "@midday/ui/badge";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { 
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Star,
  Users,
  Eye,
  Download
} from "lucide-react";
import type { MockDocument } from "@/lib/mock/documents-mock";

const typeConfig = {
  pdf: { 
    label: "PDF", 
    icon: FileText,
    color: "text-red-500",
    bgColor: "bg-red-50"
  },
  doc: { 
    label: "Word", 
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  docx: { 
    label: "Word", 
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  xlsx: { 
    label: "Excel", 
    icon: FileText,
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  xls: { 
    label: "Excel", 
    icon: FileText,
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  ppt: { 
    label: "PowerPoint", 
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  },
  pptx: { 
    label: "PowerPoint", 
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  },
  txt: { 
    label: "Text", 
    icon: FileText,
    color: "text-gray-500",
    bgColor: "bg-gray-50"
  },
  image: { 
    label: "Image", 
    icon: Image,
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  },
  video: { 
    label: "Video", 
    icon: Video,
    color: "text-pink-500",
    bgColor: "bg-pink-50"
  },
  audio: { 
    label: "Audio", 
    icon: Music,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50"
  },
  zip: { 
    label: "Archive", 
    icon: Archive,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50"
  },
  other: { 
    label: "Other", 
    icon: File,
    color: "text-gray-500",
    bgColor: "bg-gray-50"
  },
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export const columns: ColumnDef<MockDocument>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Document",
    cell: ({ row }) => {
      const document = row.original;
      const config = typeConfig[document.type];
      const Icon = config.icon;
      
      return (
        <div className="flex items-center space-x-3">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded",
            config.bgColor
          )}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div>
            <div className="font-medium">{document.name}</div>
            {document.description && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                {document.description}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as keyof typeof typeConfig;
      const config = typeConfig[type];
      
      return (
        <Badge variant="secondary" className="text-xs">
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => {
      const size = row.getValue("size") as number;
      return (
        <div className="text-sm">
          {formatFileSize(size)}
        </div>
      );
    },
  },
  {
    accessorKey: "folderName",
    header: "Folder",
    cell: ({ row }) => {
      const folderName = row.getValue("folderName") as string;
      return (
        <div className="text-sm">
          {folderName || "Root"}
        </div>
      );
    },
  },
  {
    accessorKey: "uploadedBy",
    header: "Uploaded By",
    cell: ({ row }) => {
      const user = row.original.uploadedBy;
      return (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Modified",
    cell: ({ row }) => (
      <div className="text-sm whitespace-nowrap">
        {format(new Date(row.getValue("updatedAt")), "MMM dd, yyyy")}
      </div>
    ),
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      if (!tags || tags.length === 0) {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      
      return (
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const document = row.original;
      
      return (
        <div className="flex items-center space-x-1">
          {document.starred && (
            <Star className="h-3 w-3 text-yellow-500 fill-current" />
          )}
          {document.shared && (
            <Users className="h-3 w-3 text-blue-500" />
          )}
          {document.lastAccessedAt && (
            <Eye className="h-3 w-3 text-green-500" />
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
  },
];