"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Badge } from "@midday/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { 
  Send, 
  Paperclip, 
  X, 
  Mail,
  Save,
  Calendar,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  ListOrdered
} from "lucide-react";
import { emailAPI } from "@/lib/mock/email-mock";

export function EmailComposer() {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [provider, setProvider] = useState<"gmail" | "outlook">("gmail");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!to || !subject || !body) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const result = await emailAPI.sendEmail({
        from: {
          name: "You",
          email: "you@company.com",
        },
        to: to.split(",").map(e => e.trim()),
        subject,
        body,
        provider,
      });

      if (result.success) {
        toast({
          title: "Email Sent",
          description: `Message sent successfully via ${provider}`,
        });
        
        // Reset form
        setTo("");
        setCc("");
        setBcc("");
        setSubject("");
        setBody("");
        setAttachments([]);
      }
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Email saved to drafts folder",
    });
  };

  const handleAddAttachment = () => {
    const fileName = `Document_${attachments.length + 1}.pdf`;
    setAttachments([...attachments, fileName]);
    toast({
      title: "Attachment Added",
      description: fileName,
    });
  };

  const handleSchedule = () => {
    toast({
      title: "Schedule Email",
      description: "Email scheduling coming soon",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Compose Email</CardTitle>
          <CardDescription>
            Send emails through Gmail or Outlook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Selection */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="provider">Send via:</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as "gmail" | "outlook")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Gmail
                  </div>
                </SelectItem>
                <SelectItem value="outlook">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Outlook
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Recipients */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="to">To *</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cc">Cc</Label>
                <Input
                  id="cc"
                  type="email"
                  placeholder="cc@example.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bcc">Bcc</Label>
                <Input
                  id="bcc"
                  type="email"
                  placeholder="bcc@example.com"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <Label htmlFor="body">Message *</Label>
            <div className="border rounded-lg">
              {/* Formatting toolbar */}
              <div className="flex items-center space-x-1 p-2 border-b bg-muted/50">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Underline className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                id="body"
                placeholder="Type your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[300px] border-0 resize-none focus-visible:ring-0"
              />
            </div>
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <Badge key={index} variant="secondary" className="py-1 px-2">
                    <Paperclip className="h-3 w-3 mr-1" />
                    {file}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-2"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleAddAttachment}>
                <Paperclip className="h-4 w-4 mr-2" />
                Attach File
              </Button>
              <Button variant="outline" size="sm" onClick={handleSchedule}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleSend} disabled={sending}>
                {sending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Quick templates for common email types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setSubject("Meeting Follow-up");
                setBody("Hi,\n\nThank you for taking the time to meet with me today. As discussed...\n\nBest regards,");
              }}
            >
              Meeting Follow-up
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setSubject("Project Update");
                setBody("Hi team,\n\nI wanted to provide a quick update on our project status:\n\n• \n• \n• \n\nLet me know if you have any questions.\n\nBest,");
              }}
            >
              Project Update
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                setSubject("Invoice Reminder");
                setBody("Dear Customer,\n\nThis is a friendly reminder that invoice #XXX is due for payment.\n\nAmount: $\nDue Date: \n\nThank you for your prompt attention to this matter.\n\nBest regards,");
              }}
            >
              Invoice Reminder
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}