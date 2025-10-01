"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Progress } from "@midday/ui/progress";
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
  HardDrive,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import type { MockDocument } from "@/lib/mock/documents-mock";

type StorageStats = {
  totalSize: number;
  usedSpace: number;
  totalSpace: number;
  documentCount: number;
  folderCount: number;
  recentUploads: MockDocument[];
  popularDocuments: MockDocument[];
  typeDistribution: Array<{
    type: string;
    count: number;
    size: number;
  }>;
};

type Props = {
  stats: StorageStats;
};

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
    label: "Images",
    icon: Image,
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  },
  video: { 
    label: "Videos",
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
    label: "Archives",
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

export function StorageStats({ stats }: Props) {
  const storageUsagePercent = (stats.usedSpace / stats.totalSpace) * 100;
  
  // Filter out types with no documents
  const filteredTypeDistribution = stats.typeDistribution.filter(type => type.count > 0);
  
  // Sort by size descending
  const sortedTypeDistribution = filteredTypeDistribution.sort((a, b) => b.size - a.size);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <HardDrive className="h-4 w-4 mr-2" />
            Storage Usage
          </CardTitle>
          <CardDescription>
            Current storage consumption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Used</span>
              <span className="font-medium">
                {formatFileSize(stats.usedSpace)} / {formatFileSize(stats.totalSpace)}
              </span>
            </div>
            <Progress value={storageUsagePercent} className="h-2" />
            <div className="text-center text-xs text-muted-foreground">
              {storageUsagePercent.toFixed(1)}% used
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Files</span>
              <span className="font-medium">{stats.documentCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Folders</span>
              <span className="font-medium">{stats.folderCount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Types Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            File Types
          </CardTitle>
          <CardDescription>
            Distribution by file type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedTypeDistribution.slice(0, 6).map((type) => {
              const config = typeConfig[type.type as keyof typeof typeConfig] || typeConfig.other;
              const Icon = config.icon;
              const percentage = (type.size / stats.totalSize) * 100;

              return (
                <div key={type.type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      "flex items-center justify-center w-6 h-6 rounded",
                      config.bgColor
                    )}>
                      <Icon className={cn("h-3 w-3", config.color)} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{config.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.count} files
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatFileSize(type.size)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Recently uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentUploads.slice(0, 5).map((document) => {
              const config = typeConfig[document.type] || typeConfig.other;
              const Icon = config.icon;

              return (
                <div key={document.id} className="flex items-center space-x-3">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded",
                    config.bgColor
                  )}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {document.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(document.createdAt), "MMM dd, yyyy")} • {formatFileSize(document.size)}
                    </div>
                  </div>
                  {document.starred && (
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  )}
                </div>
              );
            })}

            {stats.recentUploads.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No recent uploads
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Popular Documents */}
      {stats.popularDocuments.length > 0 && (
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Popular Documents
            </CardTitle>
            <CardDescription>
              Most frequently accessed documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.popularDocuments.slice(0, 6).map((document) => {
                const config = typeConfig[document.type] || typeConfig.other;
                const Icon = config.icon;

                return (
                  <div key={document.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded",
                      config.bgColor
                    )}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {document.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last accessed {format(new Date(document.lastAccessedAt!), "MMM dd")}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {document.shared && (
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            Shared
                          </Badge>
                        )}
                        {document.tags.slice(0, 1).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs h-4 px-1">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}