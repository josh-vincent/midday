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
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midday/ui/alert-dialog";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Download,
  Share2,
  Star,
  StarOff,
  Edit3,
  FolderOpen,
  Trash2,
  Eye,
  Clock,
  User,
  Calendar,
  HardDrive,
  Copy,
  ExternalLink,
} from "lucide-react";
import type { MockDocument, MockFolder } from "@/lib/mock/documents-mock";

type Props = {
  document: MockDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (document: MockDocument) => void;
  onDelete?: (document: MockDocument) => void;
  onStar?: (document: MockDocument) => void;
  onShare?: (document: MockDocument, userIds: string[]) => void;
  onMove?: (document: MockDocument, folderId: string) => void;
  onDownload?: (document: MockDocument) => void;
  folders: MockFolder[];
};

const typeConfig = {
  pdf: { 
    label: "PDF",
    icon: FileText,
    color: "text-red-500",
    bgColor: "bg-red-50"
  },
  doc: { 
    label: "Word Document",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  docx: { 
    label: "Word Document",
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  xlsx: { 
    label: "Excel Spreadsheet",
    icon: FileText,
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  xls: { 
    label: "Excel Spreadsheet",
    icon: FileText,
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  ppt: { 
    label: "PowerPoint Presentation",
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  },
  pptx: { 
    label: "PowerPoint Presentation",
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  },
  txt: { 
    label: "Text Document",
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

export function DocumentSheet({
  document,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onStar,
  onShare,
  onMove,
  onDownload,
  folders,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    tags: [] as string[],
  });

  if (!document) return null;

  const config = typeConfig[document.type] || typeConfig.other;
  const Icon = config.icon;

  const handleEdit = () => {
    setEditData({
      name: document.name,
      description: document.description || "",
      tags: document.tags,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onEdit?.({
      ...document,
      name: editData.name,
      description: editData.description,
      tags: editData.tags,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      name: document.name,
      description: document.description || "",
      tags: document.tags,
    });
  };

  const handleDelete = () => {
    onDelete?.(document);
    setShowDeleteDialog(false);
    onOpenChange(false);
  };

  const handleShare = () => {
    onShare?.(document, ["user_1"]);
  };

  const handleMove = (folderId: string) => {
    onMove?.(document, folderId);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-lg",
                  config.bgColor
                )}>
                  {document.thumbnail ? (
                    <img 
                      src={document.thumbnail} 
                      alt={document.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <Icon className={cn("h-6 w-6", config.color)} />
                  )}
                </div>
                <div>
                  <SheetTitle className="text-left">
                    {isEditing ? (
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="text-lg font-semibold"
                      />
                    ) : (
                      document.name
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-left">
                    {config.label} • {formatFileSize(document.size)}
                  </SheetDescription>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {document.starred && (
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                )}
                {document.shared && (
                  <Badge variant="outline" className="text-xs">
                    Shared
                  </Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => onDownload?.(document)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onStar?.(document)}
              >
                {document.starred ? (
                  <>
                    <StarOff className="h-4 w-4 mr-2" />
                    Unstar
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Star
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>

              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
            </div>

            <Separator />

            {/* Document Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    placeholder="Add a description..."
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {document.description || "No description"}
                  </p>
                )}
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {document.tags.length > 0 ? (
                    document.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>File Type</Label>
                  <p className="text-sm mt-1">{config.label}</p>
                </div>
                <div>
                  <Label>Size</Label>
                  <p className="text-sm mt-1">{formatFileSize(document.size)}</p>
                </div>
              </div>

              <div>
                <Label>Location</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm">{document.folderName || "Root"}</span>
                  <Select onValueChange={handleMove}>
                    <SelectTrigger className="w-auto h-auto p-1">
                      <FolderOpen className="h-3 w-3" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="folder_root">Root</SelectItem>
                      {folders.filter(f => f.id !== "folder_root").map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* File Information */}
            <div className="space-y-4">
              <h3 className="font-medium">File Information</h3>
              
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Uploaded by</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                      {document.uploadedBy.name.charAt(0)}
                    </div>
                    <span>{document.uploadedBy.name}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Created</span>
                  </div>
                  <span>{format(new Date(document.createdAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Modified</span>
                  </div>
                  <span>{format(new Date(document.updatedAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                </div>

                {document.lastAccessedAt && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>Last accessed</span>
                    </div>
                    <span>{format(new Date(document.lastAccessedAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span>Version</span>
                  </div>
                  <span>v{document.version}</span>
                </div>
              </div>
            </div>

            {/* Sharing Information */}
            {document.shared && document.sharedWith.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-medium">Shared With</h3>
                  <div className="space-y-2">
                    {document.sharedWith.map((user) => (
                      <div key={user.id} className="flex items-center space-x-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {document.permissions}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex justify-between">
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save Changes
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </Button>
                  </>
                )}
              </div>
              
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the document
              "{document.name}" and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}