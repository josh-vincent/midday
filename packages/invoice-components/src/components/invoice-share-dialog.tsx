"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { 
  Link, 
  Mail, 
  Copy, 
  Shield,
  Clock,
  Download,
  Eye,
  Send,
  QrCode
} from "lucide-react";
import type { Invoice, ShareOptions } from "../types";

interface InvoiceShareDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceShareDialog({ 
  invoice, 
  open, 
  onOpenChange 
}: InvoiceShareDialogProps) {
  const [shareMethod, setShareMethod] = useState<'link' | 'email'>('link');
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    expiresIn: '7d',
    password: '',
    allowDownload: true,
    requireEmail: false,
  });
  const [recipientEmail, setRecipientEmail] = useState(invoice.customer.email);
  const [emailMessage, setEmailMessage] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const { toast } = useToast();

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call to generate shareable link
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const baseUrl = window.location.origin;
      const shareId = Math.random().toString(36).substring(7);
      const link = `${baseUrl}/shared/invoice/${invoice.publicId || shareId}`;
      
      setGeneratedLink(link);
      
      toast({
        title: "Link Generated",
        description: "Shareable link has been created",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate shareable link",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) {
      await generateShareLink();
    }
    
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Link Copied",
        description: "Invoice link has been copied to clipboard",
      });
    }
  };

  const handleSendEmail = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call to send email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Email Sent",
        description: `Invoice sent to ${recipientEmail}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send invoice email",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateQRCode = () => {
    if (!generatedLink) {
      generateShareLink();
    }
    // QR code generation would go here
    toast({
      title: "QR Code Generated",
      description: "QR code for invoice has been created",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Invoice {invoice.number}</DialogTitle>
          <DialogDescription>
            Share this invoice with your customer via link or email
          </DialogDescription>
        </DialogHeader>

        <Tabs value={shareMethod} onValueChange={(v) => setShareMethod(v as 'link' | 'email')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link">
              <Link className="h-4 w-4 mr-2" />
              Share Link
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            {/* Link Options */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Link Expiry</Label>
                <Select
                  value={shareOptions.expiresIn}
                  onValueChange={(v) => setShareOptions({...shareOptions, expiresIn: v as any})}
                >
                  <SelectTrigger id="expiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        24 hours
                      </div>
                    </SelectItem>
                    <SelectItem value="7d">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        7 days
                      </div>
                    </SelectItem>
                    <SelectItem value="30d">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        30 days
                      </div>
                    </SelectItem>
                    <SelectItem value="never">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Never expires
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password Protection (Optional)</Label>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={shareOptions.password}
                    onChange={(e) => setShareOptions({...shareOptions, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-download" className="text-sm">
                      Allow PDF Download
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Recipients can download the invoice as PDF
                    </p>
                  </div>
                  <Switch
                    id="allow-download"
                    checked={shareOptions.allowDownload}
                    onCheckedChange={(checked) => 
                      setShareOptions({...shareOptions, allowDownload: checked})
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="require-email" className="text-sm">
                      Require Email Verification
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Recipients must verify email to view
                    </p>
                  </div>
                  <Switch
                    id="require-email"
                    checked={shareOptions.requireEmail}
                    onCheckedChange={(checked) => 
                      setShareOptions({...shareOptions, requireEmail: checked})
                    }
                  />
                </div>
              </div>

              {generatedLink && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <Label className="text-xs">Generated Link</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={generatedLink} 
                      readOnly 
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={generateQRCode}
                disabled={isGenerating}
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
              
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={generatedLink ? handleCopyLink : generateShareLink}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating..." : 
                   generatedLink ? "Copy Link" : "Generate Link"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            {/* Email Options */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Email</Label>
                <Input
                  id="recipient"
                  type="email"
                  placeholder="customer@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <textarea
                  id="message"
                  className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                  placeholder="Add a personal message..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="attach-pdf"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="attach-pdf" className="text-sm font-normal">
                    Attach invoice as PDF
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="send-copy"
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="send-copy" className="text-sm font-normal">
                    Send me a copy
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={isGenerating || !recipientEmail}
              >
                <Send className="h-4 w-4 mr-2" />
                {isGenerating ? "Sending..." : "Send Invoice"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}