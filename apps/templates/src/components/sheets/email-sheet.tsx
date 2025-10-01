"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@midday/ui/avatar";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useToast } from "@midday/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Reply,
  Forward,
  Archive,
  Trash2,
  Star,
  FolderOpen,
  Tag,
  Download,
  MoreVertical,
  Paperclip,
  Check,
  X,
} from "lucide-react";
import type { MockEmail } from "@/lib/mock/email-mock";

interface EmailSheetProps {
  email: MockEmail | null;
  isOpen: boolean;
  onClose: () => void;
  onReply?: (email: MockEmail) => void;
  onForward?: (email: MockEmail) => void;
}

export function EmailSheet({ 
  email, 
  isOpen, 
  onClose, 
  onReply, 
  onForward 
}: EmailSheetProps) {
  const [isStarred, setIsStarred] = useState(email?.starred || false);
  const [isRead, setIsRead] = useState(email?.read || false);
  const { toast } = useToast();

  if (!email) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleToggleStar = () => {
    setIsStarred(!isStarred);
    toast({
      title: isStarred ? "Removed from starred" : "Added to starred",
      description: `"${email.subject}" has been ${isStarred ? "removed from" : "added to"} starred emails.`,
    });
  };

  const handleToggleRead = () => {
    setIsRead(!isRead);
    toast({
      title: isRead ? "Marked as unread" : "Marked as read",
      description: `"${email.subject}" has been marked as ${isRead ? "unread" : "read"}.`,
    });
  };

  const handleArchive = () => {
    toast({
      title: "Email archived",
      description: `"${email.subject}" has been archived.`,
    });
    onClose();
  };

  const handleDelete = () => {
    toast({
      title: "Email deleted",
      description: `"${email.subject}" has been moved to trash.`,
      variant: "destructive",
    });
    onClose();
  };

  const handleReply = () => {
    if (onReply) {
      onReply(email);
    } else {
      toast({
        title: "Reply",
        description: "Reply functionality would be implemented here.",
      });
    }
  };

  const handleForward = () => {
    if (onForward) {
      onForward(email);
    } else {
      toast({
        title: "Forward",
        description: "Forward functionality would be implemented here.",
      });
    }
  };

  const handleDownloadAttachment = (attachment: any) => {
    toast({
      title: "Downloading attachment",
      description: `Downloading ${attachment.name}...`,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-2xl sm:max-w-2xl" side="right">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 min-w-0">
              <SheetTitle className="text-xl leading-tight pr-8">
                {email.subject}
              </SheetTitle>
              <div className="flex items-center space-x-2">
                {!isRead && (
                  <Badge variant="secondary" className="text-xs">
                    Unread
                  </Badge>
                )}
                {email.important && (
                  <Badge variant="destructive" className="text-xs">
                    Important
                  </Badge>
                )}
                {isStarred && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                )}
                <Badge variant="outline" className="text-xs">
                  {email.provider === "gmail" ? "Gmail" : "Outlook"}
                </Badge>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* From/To Info */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-medium">
                  {email.from.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{email.from.name}</p>
                    <p className="text-sm text-muted-foreground">{email.from.email}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(email.date)}
                  </p>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground">
                    To: {email.to.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleReply}>
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </Button>
              <Button variant="outline" size="sm" onClick={handleForward}>
                <Forward className="h-4 w-4 mr-2" />
                Forward
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleRead}>
                  <Check className="h-4 w-4 mr-2" />
                  {isRead ? "Mark as unread" : "Mark as read"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStar}>
                  <Star className={`h-4 w-4 mr-2 ${isStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                  {isStarred ? "Remove star" : "Add star"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Move to folder
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Tag className="h-4 w-4 mr-2" />
                  Add label
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-6">
          <div className="space-y-6">
            {/* Labels */}
            {email.labels.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Labels</h4>
                <div className="flex flex-wrap gap-1">
                  {email.labels.map((label) => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Email Content */}
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                {email.body ? (
                  <div className="whitespace-pre-wrap">{email.body}</div>
                ) : (
                  <p>{email.snippet}</p>
                )}
              </div>
            </div>

            {/* Attachments */}
            {email.attachments && email.attachments.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">
                  Attachments ({email.attachments.length})
                </h4>
                <div className="space-y-2">
                  {email.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-3">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDownloadAttachment(attachment)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}