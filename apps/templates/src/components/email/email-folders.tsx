"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Input } from "@midday/ui/input";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useToast } from "@midday/ui/use-toast";
import { 
  Folder, 
  FolderPlus,
  MoreVertical,
  Edit2,
  Trash2,
  Mail
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { emailAPI, type MockFolder } from "@/lib/mock/email-mock";

interface EmailFoldersProps {
  provider?: "gmail" | "outlook";
}

export function EmailFolders({ provider }: EmailFoldersProps) {
  const [folders, setFolders] = useState<MockFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<MockFolder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadFolders();
  }, [provider]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const data = await emailAPI.getFolders(provider);
      setFolders(data);
      if (data.length > 0 && !selectedFolder) {
        setSelectedFolder(data[0]);
      }
    } catch (error) {
      toast({
        title: "Error loading folders",
        description: "Failed to fetch folder data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = () => {
    toast({
      title: "Create Folder",
      description: "Folder creation dialog would open here",
    });
  };

  const handleFolderAction = (action: string, folder: MockFolder) => {
    toast({
      title: `${action} Folder`,
      description: `${action} action for ${folder.name}`,
    });
  };

  const getFolderIcon = (type: MockFolder["type"]) => {
    const icons: Record<string, string> = {
      inbox: "📥",
      sent: "📤",
      drafts: "📝",
      trash: "🗑️",
      spam: "🚫",
      custom: "📁",
    };
    return icons[type] || "📁";
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Folder List */}
      <Card className="col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Folders</CardTitle>
            <Button size="icon" variant="ghost" onClick={handleCreateFolder}>
              <FolderPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={`flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer border-b ${
                  selectedFolder?.id === folder.id ? "bg-muted" : ""
                }`}
                onClick={() => setSelectedFolder(folder)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{folder.icon || getFolderIcon(folder.type)}</span>
                  <div>
                    <p className="font-medium">{folder.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {folder.count} messages
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {folder.unreadCount > 0 && (
                    <Badge variant="secondary">
                      {folder.unreadCount}
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleFolderAction("Rename", folder)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      {folder.type === "custom" && (
                        <DropdownMenuItem 
                          onClick={() => handleFolderAction("Delete", folder)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Folder Details */}
      <Card className="col-span-2">
        {selectedFolder ? (
          <>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{selectedFolder.icon || getFolderIcon(selectedFolder.type)}</span>
                  <div>
                    <CardTitle>{selectedFolder.name}</CardTitle>
                    <CardDescription>
                      {selectedFolder.count} total • {selectedFolder.unreadCount} unread
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {selectedFolder.provider}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Folder Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedFolder.count}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Unread</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedFolder.unreadCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Read Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {selectedFolder.count > 0 
                        ? Math.round(((selectedFolder.count - selectedFolder.unreadCount) / selectedFolder.count) * 100)
                        : 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Folder Rules */}
              <div className="space-y-3">
                <h3 className="font-semibold">Folder Rules</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Auto-archive</p>
                        <p className="text-xs text-muted-foreground">
                          Archive emails older than 30 days
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Label Filter</p>
                        <p className="text-xs text-muted-foreground">
                          Move emails with specific labels
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Inactive</Badge>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    Mark All as Read
                  </Button>
                  <Button variant="outline" size="sm">
                    Empty Folder
                  </Button>
                  <Button variant="outline" size="sm">
                    Export Messages
                  </Button>
                  <Button variant="outline" size="sm">
                    Sync Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a folder to view details
          </div>
        )}
      </Card>
    </div>
  );
}