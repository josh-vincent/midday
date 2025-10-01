"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { 
  Mail, 
  Inbox, 
  Send, 
  FileText, 
  Users,
  Cloud,
  RefreshCw,
  Activity,
  Zap,
  Plus
} from "lucide-react";
import { EmailDataTable } from "@/components/tables/emails/data-table";
import { EmailSheet } from "@/components/sheets/email-sheet";
import { ComposeEmailSheet } from "@/components/sheets/compose-email-sheet";
// import { EmailSync } from "@/components/email/email-sync";
// import { EmailFolders } from "@/components/email/email-folders";
// import { EmailThreads } from "@/components/email/email-threads";
import { EmailMetrics } from "@/components/email/email-metrics";
import type { MockEmail } from "@/lib/mock/email-mock";

export default function EmailPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedProvider, setSelectedProvider] = useState<"gmail" | "outlook" | "all">("all");
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null);
  const [isEmailSheetOpen, setIsEmailSheetOpen] = useState(false);
  const [isComposeSheetOpen, setIsComposeSheetOpen] = useState(false);
  const [composeType, setComposeType] = useState<"compose" | "reply" | "forward">("compose");
  const [replyToEmail, setReplyToEmail] = useState<MockEmail | null>(null);
  const [forwardEmail, setForwardEmail] = useState<MockEmail | null>(null);

  const handleEmailSelect = (email: MockEmail) => {
    setSelectedEmail(email);
    setIsEmailSheetOpen(true);
  };

  const handleComposeEmail = () => {
    setComposeType("compose");
    setReplyToEmail(null);
    setForwardEmail(null);
    setIsComposeSheetOpen(true);
  };

  const handleReplyEmail = (email: MockEmail) => {
    setComposeType("reply");
    setReplyToEmail(email);
    setForwardEmail(null);
    setIsComposeSheetOpen(true);
    setIsEmailSheetOpen(false);
  };

  const handleForwardEmail = (email: MockEmail) => {
    setComposeType("forward");
    setReplyToEmail(null);
    setForwardEmail(email);
    setIsComposeSheetOpen(true);
    setIsEmailSheetOpen(false);
  };

  const handleCloseEmailSheet = () => {
    setIsEmailSheetOpen(false);
    setSelectedEmail(null);
  };

  const handleCloseComposeSheet = () => {
    setIsComposeSheetOpen(false);
    setComposeType("compose");
    setReplyToEmail(null);
    setForwardEmail(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Integration</h1>
          <p className="text-muted-foreground mt-2">
            Unified email management for Gmail and Outlook
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleComposeEmail}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </Button>
          <Button
            variant={selectedProvider === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("all")}
          >
            All Providers
          </Button>
          <Button
            variant={selectedProvider === "gmail" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("gmail")}
          >
            <Mail className="w-4 h-4 mr-2" />
            Gmail
          </Button>
          <Button
            variant={selectedProvider === "outlook" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedProvider("outlook")}
          >
            <Mail className="w-4 h-4 mr-2" />
            Outlook
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <EmailMetrics provider={selectedProvider} />
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Integration Features</CardTitle>
                <CardDescription>
                  Key capabilities of the Email package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Multi-Provider Support</p>
                      <p className="text-sm text-muted-foreground">
                        Seamless integration with Gmail and Outlook
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RefreshCw className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Real-time Sync</p>
                      <p className="text-sm text-muted-foreground">
                        Automatic email synchronization with webhooks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Attachment Handling</p>
                      <p className="text-sm text-muted-foreground">
                        Upload, download, and manage email attachments
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Thread Management</p>
                      <p className="text-sm text-muted-foreground">
                        Conversation threading and batch operations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Zap className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Batch Operations</p>
                      <p className="text-sm text-muted-foreground">
                        Archive, delete, mark as read in bulk
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Package Info</CardTitle>
                <CardDescription>
                  Technical details and dependencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-mono">@midday/email-providers</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Providers</span>
                    <span>Gmail, Outlook</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dependencies</span>
                    <span>googleapis, ms-graph</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Features</span>
                    <span>OAuth2, Webhooks, Sync</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-2">Provider Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center">
                        <Cloud className="w-4 h-4 mr-2 text-green-500" />
                        Gmail API
                      </span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center">
                        <Cloud className="w-4 h-4 mr-2 text-green-500" />
                        Microsoft Graph
                      </span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inbox" className="space-y-6">
          <EmailDataTable 
            provider={selectedProvider === "all" ? undefined : selectedProvider}
            onEmailSelect={handleEmailSelect}
            onComposeEmail={handleComposeEmail}
            onComposeReply={handleReplyEmail}
            onComposeForward={handleForwardEmail}
          />
        </TabsContent>

        <TabsContent value="compose" className="space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Send className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Compose Email</h3>
                <p className="text-muted-foreground">
                  Use the compose button in the header or click here to start writing a new email.
                </p>
              </div>
              <Button onClick={handleComposeEmail}>
                <Plus className="w-4 h-4 mr-2" />
                Compose Email
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="folders" className="space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Inbox className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Email Folders</h3>
                <p className="text-muted-foreground">
                  Folder management functionality will be implemented here.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="threads" className="space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Email Threads</h3>
                <p className="text-muted-foreground">
                  Email threading functionality will be implemented here.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <RefreshCw className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Email Sync</h3>
                <p className="text-muted-foreground">
                  Email synchronization functionality will be implemented here.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Email Sheets */}
      <EmailSheet
        email={selectedEmail}
        isOpen={isEmailSheetOpen}
        onClose={handleCloseEmailSheet}
        onReply={handleReplyEmail}
        onForward={handleForwardEmail}
      />

      <ComposeEmailSheet
        isOpen={isComposeSheetOpen}
        onClose={handleCloseComposeSheet}
        type={composeType}
        replyTo={replyToEmail}
        forwardEmail={forwardEmail}
      />
    </div>
  );
}