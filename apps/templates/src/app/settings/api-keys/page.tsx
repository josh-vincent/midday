"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@midday/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@midday/ui/alert-dialog";
import { useToast } from "@midday/ui/use-toast";
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Calendar,
  Shield,
  Globe,
  Server,
  RefreshCw
} from "lucide-react";

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  lastUsed: Date | null;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

// Mock API keys
const mockAPIKeys: APIKey[] = [
  {
    id: "1",
    name: "Production API",
    key: "pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    permissions: ["read", "write", "admin"],
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    isActive: true,
  },
  {
    id: "2",
    name: "Development API",
    key: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    permissions: ["read", "write"],
    lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    isActive: true,
  },
  {
    id: "3",
    name: "Analytics Integration",
    key: "pk_live_yyyyyyyyyyyyyyyyyyyyyyyyyyyy",
    permissions: ["read"],
    lastUsed: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    isActive: false,
  },
];

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>(mockAPIKeys);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(["read"]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "API key has been copied to your clipboard.",
    });
  };

  const maskKey = (key: string) => {
    return key.slice(0, 12) + "•".repeat(20) + key.slice(-8);
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for the API key.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newKey: APIKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: `sk_live_${Math.random().toString(36).substr(2, 32)}`,
        permissions: newKeyPermissions,
        lastUsed: null,
        createdAt: new Date(),
        isActive: true,
      };

      setApiKeys(prev => [newKey, ...prev]);
      setNewKeyName("");
      setNewKeyPermissions(["read"]);
      setCreateDialogOpen(false);

      toast({
        title: "API key created",
        description: "Your new API key has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setApiKeys(prev => prev.filter(key => key.id !== keyId));

      toast({
        title: "API key deleted",
        description: "The API key has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleKey = async (keyId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setApiKeys(prev => prev.map(key => 
        key.id === keyId ? { ...key, isActive: !key.isActive } : key
      ));

      const key = apiKeys.find(k => k.id === keyId);
      toast({
        title: `API key ${key?.isActive ? 'disabled' : 'enabled'}`,
        description: `The API key has been ${key?.isActive ? 'disabled' : 'enabled'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateKey = async (keyId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setApiKeys(prev => prev.map(key => 
        key.id === keyId 
          ? { ...key, key: `sk_live_${Math.random().toString(36).substr(2, 32)}`, lastUsed: null }
          : key
      ));

      toast({
        title: "API key regenerated",
        description: "A new API key has been generated. Update your applications with the new key.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPermissionBadgeVariant = (permission: string) => {
    switch (permission) {
      case "admin": return "destructive";
      case "write": return "default";
      case "read": return "secondary";
      default: return "outline";
    }
  };

  const togglePermission = (permission: string) => {
    setNewKeyPermissions(prev => 
      prev.includes(permission) 
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <h1 className="text-2xl font-bold">API Keys</h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage API keys for your integrations.
          </p>
        </div>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for your application or integration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API, Analytics Integration"
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="flex gap-2">
                  {["read", "write", "admin"].map((permission) => (
                    <Button
                      key={permission}
                      type="button"
                      variant={newKeyPermissions.includes(permission) ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePermission(permission)}
                    >
                      {permission}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Select the permissions this API key should have. Be careful with admin permissions.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateKey} disabled={creating}>
                {creating ? "Creating..." : "Create Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {apiKey.name}
                    <Badge variant={apiKey.isActive ? "success" : "secondary"}>
                      {apiKey.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created {apiKey.createdAt.toLocaleDateString()}
                    </span>
                    {apiKey.lastUsed ? (
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Last used {apiKey.lastUsed.toLocaleString()}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        Never used
                      </span>
                    )}
                    {apiKey.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires {apiKey.expiresAt.toLocaleDateString()}
                      </span>
                    )}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleKey(apiKey.id)}
                  >
                    {apiKey.isActive ? "Disable" : "Enable"}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will generate a new API key and invalidate the old one. 
                          Make sure to update all applications using this key.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRegenerateKey(apiKey.id)}>
                          Regenerate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the 
                          API key and it will no longer work in your applications.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteKey(apiKey.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Key */}
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                  >
                    {showKeys[apiKey.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiKey.key)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="flex gap-2">
                  {apiKey.permissions.map((permission) => (
                    <Badge 
                      key={permission} 
                      variant={getPermissionBadgeVariant(permission)}
                    >
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {apiKeys.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any API keys yet. Create one to get started with our API.
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First API Key
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Security Notice */}
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="font-medium text-orange-900 dark:text-orange-100">
                Security Best Practices
              </h4>
              <ul className="text-sm text-orange-700 dark:text-orange-200 space-y-1">
                <li>• Never share your API keys in code repositories or public forums</li>
                <li>• Use environment variables to store API keys in your applications</li>
                <li>• Regenerate keys regularly and when team members leave</li>
                <li>• Use the minimum required permissions for each key</li>
                <li>• Monitor key usage and disable unused keys</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}