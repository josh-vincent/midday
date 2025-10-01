"use client";

import { Card, CardContent } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
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
  StarOff,
  Download,
  Share2,
  MoreHorizontal,
  Users,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import type { MockDocument } from "@/lib/mock/documents-mock";

type Props = {
  documents: MockDocument[];
  loading?: boolean;
  hasFilters?: boolean;
  onDocumentClick?: (document: MockDocument) => void;
  onStarDocument?: (document: MockDocument) => void;
  onShareDocument?: (document: MockDocument, userIds: string[]) => void;
  onMoveDocument?: (document: MockDocument, folderId: string) => void;
  onDownloadDocument?: (document: MockDocument) => void;
  onDeleteDocument?: (document: MockDocument) => void;
};

const typeConfig = {
  pdf: { 
    icon: FileText,
    color: "text-red-500",
    bgColor: "bg-red-50"
  },
  doc: { 
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  docx: { 
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  xlsx: { 
    icon: FileText,
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  xls: { 
    icon: FileText,
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
  ppt: { 
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  },
  pptx: { 
    icon: FileText,
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  },
  txt: { 
    icon: FileText,
    color: "text-gray-500",
    bgColor: "bg-gray-50"
  },
  image: { 
    icon: Image,
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  },
  video: { 
    icon: Video,
    color: "text-pink-500",
    bgColor: "bg-pink-50"
  },
  audio: { 
    icon: Music,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50"
  },
  zip: { 
    icon: Archive,
    color: "text-yellow-500",
    bgColor: "bg-yellow-50"
  },
  other: { 
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

function DocumentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-gray-200 rounded"></div>
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="mt-6 text-center">
        <h3 className="text-lg font-semibold">
          {hasFilters ? "No documents found" : "No documents yet"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {hasFilters 
            ? "Try adjusting your search or filter criteria to find what you're looking for."
            : "Get started by uploading your first document or creating a folder to organize your files."
          }
        </p>
      </div>
    </div>
  );
}

export function DocumentGrid({
  documents,
  loading = false,
  hasFilters = false,
  onDocumentClick,
  onStarDocument,
  onShareDocument,
  onMoveDocument,
  onDownloadDocument,
  onDeleteDocument,
}: Props) {
  if (loading) {
    return <DocumentGridSkeleton />;
  }

  if (!documents?.length) {
    return <EmptyState hasFilters={hasFilters} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((document) => {
        const config = typeConfig[document.type];
        const Icon = config.icon;

        return (
          <Card 
            key={document.id} 
            className={cn(
              "cursor-pointer hover:shadow-md transition-all duration-200 group",
              document.status === "archived" && "opacity-60"
            )}
            onClick={() => onDocumentClick?.(document)}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg",
                  config.bgColor
                )}>
                  {document.thumbnail ? (
                    <img 
                      src={document.thumbnail} 
                      alt={document.name}
                      className="w-10 h-10 object-cover rounded-lg"
                    />
                  ) : (
                    <Icon className={cn("h-5 w-5", config.color)} />
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {document.starred && (
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuItem onClick={() => onDownloadDocument?.(document)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={() => onStarDocument?.(document)}>
                        {document.starred ? (
                          <>
                            <StarOff className="mr-2 h-4 w-4" />
                            Unstar
                          </>
                        ) : (
                          <>
                            <Star className="mr-2 h-4 w-4" />
                            Star
                          </>
                        )}
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onShareDocument?.(document, ["user_1"])}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => onDeleteDocument?.(document)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm leading-none truncate" title={document.name}>
                  {document.name}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(document.size)}</span>
                  <span>{format(new Date(document.updatedAt), "MMM dd")}</span>
                </div>

                {document.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {document.description}
                  </p>
                )}

                {/* Tags */}
                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {document.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-1 h-5">
                        {tag}
                      </Badge>
                    ))}
                    {document.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs px-1 h-5">
                        +{document.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                      {document.uploadedBy.name.charAt(0)}
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                      {document.uploadedBy.name.split(' ')[0]}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {document.shared && (
                      <Users className="h-3 w-3 text-blue-500" />
                    )}
                    {document.lastAccessedAt && (
                      <Eye className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}