"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Avatar } from "@midday/ui/avatar";
import { ScrollArea } from "@midday/ui/scroll-area";
import { useToast } from "@midday/ui/use-toast";
import { 
  MessageSquare, 
  Users, 
  Clock, 
  ChevronDown,
  ChevronUp,
  Reply,
  Forward,
  Star,
  Archive,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { emailAPI, type MockEmailThread } from "@/lib/mock/email-mock";

interface EmailThreadsProps {
  provider?: "gmail" | "outlook";
}

export function EmailThreads({ provider }: EmailThreadsProps) {
  const [threads, setThreads] = useState<MockEmailThread[]>([]);
  const [expandedThreads, setExpandedThreads] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadThreads();
  }, [provider]);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const data = await emailAPI.getThreads(provider);
      setThreads(data);
    } catch (error) {
      toast({
        title: "Error loading threads",
        description: "Failed to fetch thread data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleThread = (threadId: string) => {
    setExpandedThreads(prev =>
      prev.includes(threadId)
        ? prev.filter(id => id !== threadId)
        : [...prev, threadId]
    );
  };

  const handleThreadAction = (action: string, thread: MockEmailThread) => {
    toast({
      title: `${action} Thread`,
      description: `Thread "${thread.subject}" ${action.toLowerCase()}`,
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getParticipantInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Thread Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Threads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-muted-foreground">Ongoing conversations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg. Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">4.5</p>
            <p className="text-xs text-muted-foreground">Per thread</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1.2h</p>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">28</p>
            <p className="text-xs text-muted-foreground">Unique contacts</p>
          </CardContent>
        </Card>
      </div>

      {/* Thread List */}
      <Card>
        <CardHeader>
          <CardTitle>Email Threads</CardTitle>
          <CardDescription>
            Conversation threads from {provider || "all providers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {threads.map((thread) => {
              const isExpanded = expandedThreads.includes(thread.id);
              const latestMessage = thread.messages[thread.messages.length - 1];
              
              return (
                <div key={thread.id} className="border rounded-lg mb-4">
                  {/* Thread Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleThread(thread.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium">{thread.subject}</h3>
                          <Badge variant="outline">{thread.messageCount} messages</Badge>
                          {thread.unreadCount > 0 && (
                            <Badge variant="secondary">{thread.unreadCount} unread</Badge>
                          )}
                          {thread.starred && (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{thread.participants.length} participants</span>
                          </div>
                          <span>•</span>
                          <span>Last reply: {formatDate(thread.lastReply)}</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {thread.provider}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {latestMessage.snippet}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleThreadAction("Archive", thread)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive Thread
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleThreadAction("Mark as Read", thread)}>
                              Mark All as Read
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleThreadAction("Mute", thread)}>
                              Mute Conversation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Thread Messages */}
                  {isExpanded && (
                    <div className="border-t bg-muted/20">
                      {thread.messages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`p-4 ${index !== thread.messages.length - 1 ? "border-b" : ""}`}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8">
                              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {getParticipantInitials(message.from.name)}
                                </span>
                              </div>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium text-sm">{message.from.name}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {message.from.email}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(message.date)}
                                </span>
                              </div>
                              <p className="text-sm mt-1">{message.snippet}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <Button size="sm" variant="ghost">
                                  <Reply className="h-3 w-3 mr-1" />
                                  Reply
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Forward className="h-3 w-3 mr-1" />
                                  Forward
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}