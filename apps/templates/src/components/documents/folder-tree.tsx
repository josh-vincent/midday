"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import type { MockFolder } from "@/lib/mock/documents-mock";

type Props = {
  folders: MockFolder[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
};

type FolderTreeNode = MockFolder & {
  children: FolderTreeNode[];
  level: number;
};

export function FolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
}: Props) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["folder_root"])
  );

  // Build tree structure
  const buildTree = (folders: MockFolder[]): FolderTreeNode[] => {
    const folderMap = new Map<string, FolderTreeNode>();
    
    // Initialize all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        ...folder,
        children: [],
        level: 0,
      });
    });

    const tree: FolderTreeNode[] = [];
    
    // Build parent-child relationships
    folders.forEach(folder => {
      const node = folderMap.get(folder.id)!;
      
      if (folder.parentId && folderMap.has(folder.parentId)) {
        const parent = folderMap.get(folder.parentId)!;
        node.level = parent.level + 1;
        parent.children.push(node);
      } else if (folder.id === "folder_root") {
        tree.push(node);
      }
    });

    return tree;
  };

  const folderTree = buildTree(folders);

  const toggleExpanded = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const renderFolder = (folder: FolderTreeNode) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.children.length > 0;
    const isRoot = folder.id === "folder_root";

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
            isSelected && "bg-accent text-accent-foreground",
            isRoot && "font-medium"
          )}
          style={{ paddingLeft: `${folder.level * 16 + 8}px` }}
          onClick={() => onFolderSelect(isRoot ? null : folder.id)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(folder.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {!hasChildren && <div className="w-5" />}
            
            <div className="flex items-center min-w-0">
              {isExpanded ? (
                <FolderOpen className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
              ) : (
                <Folder 
                  className="h-4 w-4 mr-2 flex-shrink-0" 
                  style={{ color: folder.color || undefined }}
                />
              )}
              
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">
                  {isRoot ? "All Documents" : folder.name}
                </div>
                {!isRoot && folder.documentCount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {folder.documentCount} files • {formatFileSize(folder.size)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isRoot && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[140px]">
                <DropdownMenuItem onClick={onCreateFolder}>
                  <Plus className="mr-2 h-3 w-3" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {folder.children
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(renderFolder)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-muted-foreground">
          Browse Folders
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onCreateFolder}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="space-y-0.5">
        {folderTree.map(renderFolder)}
      </div>
    </div>
  );
}