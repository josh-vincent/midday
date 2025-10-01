"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { Badge } from "@midday/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import {
  Send,
  Paperclip,
  Save,
  X,
  Clock,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { ScrollArea } from "@midday/ui/scroll-area";
import type { MockEmail } from "@/lib/mock/email-mock";
import { emailAPI } from "@/lib/mock/email-mock";

interface ComposeEmailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: MockEmail;
  forwardEmail?: MockEmail;
  type?: "compose" | "reply" | "forward";
}

export function ComposeEmailSheet({ 
  isOpen, 
  onClose, 
  replyTo,
  forwardEmail,
  type = "compose"
}: ComposeEmailSheetProps) {
  const [formData, setFormData] = useState({
    to: type === "reply" ? replyTo?.from.email || "" : "",
    cc: "",
    bcc: "",
    subject: getSubjectPrefix(),
    body: getBodyPrefix(),
    provider: "gmail" as "gmail" | "outlook",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const { toast } = useToast();

  function getSubjectPrefix() {
    if (type === "reply" && replyTo) {
      return replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`;
    }
    if (type === "forward" && forwardEmail) {
      return forwardEmail.subject.startsWith("Fwd:") ? forwardEmail.subject : `Fwd: ${forwardEmail.subject}`;
    }
    return "";
  }

  function getBodyPrefix() {
    if (type === "reply" && replyTo) {
      return `\n\nOn ${replyTo.date.toLocaleDateString()}, ${replyTo.from.name} <${replyTo.from.email}> wrote:\n> ${replyTo.snippet}`;
    }
    if (type === "forward" && forwardEmail) {
      return `\n\n---------- Forwarded message ---------\nFrom: ${forwardEmail.from.name} <${forwardEmail.from.email}>\nDate: ${forwardEmail.date.toLocaleDateString()}\nSubject: ${forwardEmail.subject}\nTo: ${forwardEmail.to.join(", ")}\n\n${forwardEmail.body || forwardEmail.snippet}`;
    }
    return "";
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!formData.to.trim()) {
      toast({
        title: "Recipient required",
        description: "Please enter at least one recipient.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.subject.trim()) {
      toast({
        title: "Subject required",
        description: "Please enter a subject line.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await emailAPI.sendEmail({
        to: formData.to.split(",").map(email => email.trim()),
        subject: formData.subject,
        body: formData.body,
        provider: formData.provider,
      });

      toast({
        title: "Email sent",
        description: "Your email has been sent successfully.",
      });
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Failed to send email",
        description: "There was an error sending your email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    toast({
      title: "Draft saved",
      description: "Your email has been saved as a draft.",
    });
  };

  const handleSchedule = () => {
    toast({
      title: "Schedule email",
      description: "Email scheduling functionality would be implemented here.",
    });
  };

  const resetForm = () => {
    setFormData({
      to: "",
      cc: "",
      bcc: "",
      subject: "",
      body: "",
      provider: "gmail",
    });
    setAttachments([]);
    setShowCc(false);
    setShowBcc(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getSheetTitle = () => {
    switch (type) {
      case "reply":
        return "Reply";
      case "forward":
        return "Forward";
      default:
        return "Compose Email";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full max-w-2xl sm:max-w-2xl" side="right">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{getSheetTitle()}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          <div className="space-y-4">
            {/* Provider Selection */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="provider" className="text-sm font-medium">
                From:
              </Label>
              <Select
                value={formData.provider}
                onValueChange={(value: "gmail" | "outlook") => 
                  handleInputChange("provider", value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gmail">Gmail</SelectItem>
                  <SelectItem value="outlook">Outlook</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* To Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="to" className="text-sm font-medium">
                  To
                </Label>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {!showCc && (
                    <button
                      type="button"
                      onClick={() => setShowCc(true)}
                      className="hover:text-foreground"
                    >
                      Cc
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      type="button"
                      onClick={() => setShowBcc(true)}
                      className="hover:text-foreground"
                    >
                      Bcc
                    </button>
                  )}
                </div>
              </div>
              <Input
                id="to"
                value={formData.to}
                onChange={(e) => handleInputChange("to", e.target.value)}
                placeholder="recipient@example.com"
                className="w-full"
              />
            </div>

            {/* Cc Field */}
            {showCc && (
              <div className="space-y-2">
                <Label htmlFor="cc" className="text-sm font-medium">
                  Cc
                </Label>
                <Input
                  id="cc"
                  value={formData.cc}
                  onChange={(e) => handleInputChange("cc", e.target.value)}
                  placeholder="cc@example.com"
                  className="w-full"
                />
              </div>
            )}

            {/* Bcc Field */}
            {showBcc && (
              <div className="space-y-2">
                <Label htmlFor="bcc" className="text-sm font-medium">
                  Bcc
                </Label>
                <Input
                  id="bcc"
                  value={formData.bcc}
                  onChange={(e) => handleInputChange("bcc", e.target.value)}
                  placeholder="bcc@example.com"
                  className="w-full"
                />
              </div>
            )}

            {/* Subject Field */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="Email subject"
                className="w-full"
              />
            </div>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Attachments</Label>
                <div className="space-y-1">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-3 w-3" />
                        <span>{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(file.size)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Email Body */}
          <div className="flex-1 mt-4 space-y-2">
            <Label htmlFor="body" className="text-sm font-medium">
              Message
            </Label>
            <ScrollArea className="h-64">
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => handleInputChange("body", e.target.value)}
                placeholder="Type your message here..."
                className="min-h-60 resize-none border-0 focus-visible:ring-0"
              />
            </ScrollArea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSend}
                disabled={isSending}
                className="min-w-20"
              >
                {isSending ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Sending</span>
                  </div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleSchedule}>
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule send
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="file"
                multiple
                onChange={handleFileAttachment}
                className="hidden"
                id="file-attachment"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => document.getElementById("file-attachment")?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSaveDraft}
              >
                <Save className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}