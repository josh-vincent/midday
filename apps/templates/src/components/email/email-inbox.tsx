"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import { Avatar } from "@midday/ui/avatar";
import { ScrollArea } from "@midday/ui/scroll-area";
import { Skeleton } from "@midday/ui/skeleton";
import { useToast } from "@midday/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@midday/ui/dropdown-menu";
import { 
  Mail, 
  Star, 
  Paperclip, 
  Archive, 
  Trash2, 
  MoreVertical,
  RefreshCw,
  Check,
  X,
  FolderOpen,
  Reply,
  Forward,
  Tag
} from "lucide-react";
import { emailAPI, type MockEmail } from "@/lib/mock/email-mock";

interface EmailInboxProps {
  provider?: "gmail" | "outlook";
}

export function EmailInbox({ provider }: EmailInboxProps) {
  const [emails, setEmails] = useState<MockEmail[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEmails();
  }, [provider]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await emailAPI.getEmails(provider);
      setEmails(data);
      if (data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      }
    } catch (error) {
      toast({
        title: "Error loading emails",
        description: "Failed to fetch email data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map(e => e.id));
    }
  };

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev =>
      prev.includes(emailId)
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleBulkAction = async (action: string) => {
    if (selectedEmails.length === 0) return;

    toast({
      title: `${action} Emails`,
      description: `${action} ${selectedEmails.length} emails`,
    });

    if (action === "Archive") {
      setEmails(prev => prev.filter(e => !selectedEmails.includes(e.id)));
      setSelectedEmails([]);
    } else if (action === "Mark as Read") {
      setEmails(prev =>
        prev.map(e => selectedEmails.includes(e.id) ? { ...e, read: true } : e)
      );
      setSelectedEmails([]);
    }
  };

  const handleStarEmail = (emailId: string) => {
    setEmails(prev =>
      prev.map(e => e.id === emailId ? { ...e, starred: !e.starred } : e)
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Email List */}
      <Card className="col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Inbox</CardTitle>
            <Button onClick={loadEmails} size="icon" variant="ghost">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              checked={selectedEmails.length === emails.length && emails.length > 0}
              onCheckedChange={handleSelectAll}
            />
            {selectedEmails.length > 0 && (
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleBulkAction("Archive")}
                >
                  <Archive className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleBulkAction("Delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleBulkAction("Mark as Read")}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`flex items-start space-x-3 p-4 border-b hover:bg-muted/50 cursor-pointer ${
                  selectedEmail?.id === email.id ? "bg-muted" : ""
                } ${!email.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}
                onClick={() => setSelectedEmail(email)}
              >
                <Checkbox
                  checked={selectedEmails.includes(email.id)}
                  onCheckedChange={() => handleSelectEmail(email.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStarEmail(email.id);
                  }}
                >
                  <Star
                    className={`h-4 w-4 ${
                      email.starred ? "fill-yellow-400 text-yellow-400" : ""
                    }`}
                  />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${!email.read ? "font-semibold" : ""}`}>
                      {email.from.name}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(email.date)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${!email.read ? "font-medium" : ""}`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {email.snippet}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {email.attachments && email.attachments.length > 0 && (
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                    )}
                    {email.important && (
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        Important
                      </Badge>
                    )}
                    {email.labels.map((label) => (
                      <Badge key={label} variant="outline" className="text-xs px-1 py-0">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Email Content */}
      <Card className="col-span-2">
        {selectedEmail ? (
          <>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{selectedEmail.subject}</CardTitle>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {selectedEmail.from.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedEmail.from.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEmail.from.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button variant="outline" size="sm">
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
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
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-2">
                <span>To: {selectedEmail.to.join(", ")}</span>
                <span>{formatDate(selectedEmail.date)}</span>
                <Badge variant="outline">
                  {selectedEmail.provider}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {selectedEmail.body ? (
                  <div className="whitespace-pre-wrap">{selectedEmail.body}</div>
                ) : (
                  <p>{selectedEmail.snippet}</p>
                )}
              </div>

              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-semibold mb-3">
                    Attachments ({selectedEmail.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((attachment, index) => (
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
                        <Button size="sm" variant="ghost">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select an email to view
          </div>
        )}
      </Card>
    </div>
  );
}