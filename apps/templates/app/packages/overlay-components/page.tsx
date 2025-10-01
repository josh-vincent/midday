"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Separator } from "@midday/ui/separator";
import { 
  ChevronLeft,
  Layers,
  Settings,
  X,
  Search,
  Command,
  FileText,
  Users,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { cn } from "@midday/ui/cn";

// Mock Sheet Component
const BaseSheet = ({ 
  open, 
  onOpenChange, 
  side, 
  title, 
  children 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  side: "left" | "right"; 
  title: string; 
  children: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Sheet */}
      <div 
        className={cn(
          "relative bg-background shadow-lg w-96 p-6 overflow-y-auto",
          side === "right" ? "ml-auto" : "mr-auto"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Mock Modal Component
const BaseModal = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  children 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  title: string; 
  description?: string; 
  children: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Mock Command Palette Component
const CommandPalette = ({ 
  open, 
  onOpenChange, 
  placeholder, 
  commands 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  placeholder: string; 
  commands: Array<{ id: string; label: string; icon?: React.ComponentType<any>; action: () => void }>;
}) => {
  const [query, setQuery] = useState("");

  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Command Palette */}
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center px-4 py-3 border-b">
          <Search className="h-4 w-4 mr-3 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 h-auto p-0"
            autoFocus
          />
        </div>
        
        <div className="max-h-60 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command) => {
              const IconComponent = command.icon || Command;
              return (
                <Button
                  key={command.id}
                  variant="ghost"
                  className="w-full justify-start h-auto px-4 py-3 rounded-none"
                  onClick={() => {
                    command.action();
                    onOpenChange(false);
                  }}
                >
                  <IconComponent className="h-4 w-4 mr-3" />
                  {command.label}
                </Button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No commands found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function OverlayComponentsShowcase() {
  const [showSheet, setShowSheet] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [sheetSide, setSheetSide] = useState<"left" | "right">("right");
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: "success" | "error" }>>([]);

  const commands = [
    {
      id: "new-customer",
      label: "Create New Customer",
      icon: Users,
      action: () => addNotification("Creating new customer...", "success")
    },
    {
      id: "new-invoice",
      label: "Create New Invoice",
      icon: FileText,
      action: () => addNotification("Creating new invoice...", "success")
    },
    {
      id: "billing",
      label: "View Billing",
      icon: CreditCard,
      action: () => addNotification("Opening billing...", "success")
    },
    {
      id: "calendar",
      label: "Open Calendar",
      icon: Calendar,
      action: () => addNotification("Opening calendar...", "success")
    },
    {
      id: "settings",
      label: "Open Settings",
      icon: Settings,
      action: () => addNotification("Opening settings...", "success")
    }
  ];

  const addNotification = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Back Navigation */}
        <div>
          <Link href="/packages">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Packages
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-blue-500 flex items-center justify-center text-white">
              <Layers className="h-10 w-10" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">@midday/overlay-components</h1>
                  <Badge className="text-white bg-green-500" variant="secondary">
                    stable
                  </Badge>
                  <Badge variant="outline">v1.0.0</Badge>
                </div>
                <p className="text-lg text-muted-foreground">
                  Flexible overlay components including modals, sheets, and command palettes. Built for modern applications with keyboard navigation and accessibility.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button asChild>
                  <a href="https://github.com/midday-ai/overlay-components" target="_blank" rel="noopener noreferrer">
                    View Source
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://docs.midday.ai/packages/overlay-components" target="_blank" rel="noopener noreferrer">
                    Documentation
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Interactive Demo */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Interactive Demo</h2>
            <p className="text-muted-foreground">
              Try out the overlay components below. Each component demonstrates different use cases and interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Base Sheet Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Base Sheet
                </CardTitle>
                <CardDescription>
                  Slide-out panel for additional content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sheet Position</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={sheetSide === "left" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSheetSide("left")}
                    >
                      Left
                    </Button>
                    <Button
                      variant={sheetSide === "right" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSheetSide("right")}
                    >
                      Right
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowSheet(true)}
                  className="w-full"
                >
                  Open Sheet
                </Button>
              </CardContent>
            </Card>

            {/* Base Modal Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Base Modal
                </CardTitle>
                <CardDescription>
                  Centered dialog for important actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowModal(true)}
                  className="w-full"
                >
                  Open Modal
                </Button>
              </CardContent>
            </Card>

            {/* Command Palette Demo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Command className="h-5 w-5" />
                  Command Palette
                </CardTitle>
                <CardDescription>
                  Quick action search interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setShowCommandPalette(true)}
                  className="w-full"
                >
                  Open Command Palette
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: You can also press Cmd+K (Mac) or Ctrl+K (Windows) to open
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
            <CardDescription>
              What makes these overlay components special
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Focus Management
                </h4>
                <p className="text-sm text-muted-foreground">
                  Automatic focus trapping and restoration for accessibility
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Keyboard Navigation
                </h4>
                <p className="text-sm text-muted-foreground">
                  Full keyboard support with intuitive shortcuts
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Portal Rendering
                </h4>
                <p className="text-sm text-muted-foreground">
                  Renders outside the normal DOM tree to avoid z-index issues
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Animation Support
                </h4>
                <p className="text-sm text-muted-foreground">
                  Smooth enter/exit animations with customizable transitions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation */}
        <Card>
          <CardHeader>
            <CardTitle>Installation</CardTitle>
            <CardDescription>
              Get started with @midday/overlay-components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">npm</h4>
              <code className="block p-3 bg-muted rounded-md text-sm font-mono">
                npm install @midday/overlay-components
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Usage</h4>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                <code>{`import { BaseSheet, BaseModal, CommandPalette } from "@midday/overlay-components";

// Sheet Example
<BaseSheet open={isOpen} onOpenChange={setIsOpen} side="right" title="Settings">
  <div>Sheet content here</div>
</BaseSheet>

// Modal Example
<BaseModal open={showModal} onOpenChange={setShowModal} title="Confirm">
  <div>Modal content here</div>
</BaseModal>

// Command Palette Example
<CommandPalette
  open={showCommands}
  onOpenChange={setShowCommands}
  commands={commands}
  placeholder="Type a command..."
/>`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overlay Components */}
      <BaseSheet
        open={showSheet}
        onOpenChange={setShowSheet}
        side={sheetSide}
        title="Settings Panel"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">User Preferences</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Enter username" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter email" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-medium">Notifications</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Email notifications</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span className="text-sm">Push notifications</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span className="text-sm">SMS notifications</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button className="flex-1">Save Changes</Button>
            <Button variant="outline" onClick={() => setShowSheet(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </BaseSheet>

      <BaseModal
        open={showModal}
        onOpenChange={setShowModal}
        title="Confirm Action"
        description="Are you sure you want to proceed with this action? This cannot be undone."
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800">Warning</p>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              This action will permanently delete all selected items.
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowModal(false);
                addNotification("Action completed successfully", "success");
              }}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </BaseModal>

      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        placeholder="Type a command..."
        commands={commands}
      />

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "p-3 rounded-md shadow-lg border flex items-center gap-2",
              notification.type === "success" 
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            )}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {notification.message}
          </div>
        ))}
      </div>

      {/* Global keyboard handler for command palette */}
      <div
        className="fixed inset-0 pointer-events-none"
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault();
            setShowCommandPalette(true);
          }
        }}
        tabIndex={-1}
      />
    </>
  );
}