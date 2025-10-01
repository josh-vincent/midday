"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Switch } from "@midday/ui/switch";
import { useToast } from "@midday/ui/use-toast";
import { 
  Shield, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle, 
  Monitor,
  MapPin,
  Trash2
} from "lucide-react";

interface SecuritySession {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  current: boolean;
}

interface SecurityActivity {
  id: string;
  action: string;
  device: string;
  location: string;
  timestamp: Date;
  success: boolean;
}

// Mock data
const mockSessions: SecuritySession[] = [
  {
    id: "1",
    device: "Chrome on macOS",
    location: "San Francisco, CA",
    ipAddress: "192.168.1.100",
    lastActive: new Date(),
    current: true,
  },
  {
    id: "2",
    device: "Safari on iPhone",
    location: "San Francisco, CA",
    ipAddress: "192.168.1.101",
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    current: false,
  },
  {
    id: "3",
    device: "Chrome on Windows",
    location: "New York, NY",
    ipAddress: "10.0.0.50",
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    current: false,
  },
];

const mockActivity: SecurityActivity[] = [
  {
    id: "1",
    action: "Login",
    device: "Chrome on macOS",
    location: "San Francisco, CA",
    timestamp: new Date(),
    success: true,
  },
  {
    id: "2",
    action: "Password change",
    device: "Chrome on macOS",
    location: "San Francisco, CA",
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    success: true,
  },
  {
    id: "3",
    action: "Failed login attempt",
    device: "Chrome on Windows",
    location: "Unknown",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    success: false,
  },
  {
    id: "4",
    action: "2FA enabled",
    device: "Chrome on macOS",
    location: "San Francisco, CA",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    success: true,
  },
];

export function SecurityForm() {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [settingUp2FA, setSettingUp2FA] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Password mismatch",
        description: "New passwords don't match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPasswords({ current: "", new: "", confirm: "" });
      toast({
        title: "Password updated",
        description: "Your password has been successfully changed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggle2FA = async () => {
    setSettingUp2FA(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTwoFactorEnabled(!twoFactorEnabled);
      toast({
        title: twoFactorEnabled ? "2FA disabled" : "2FA enabled",
        description: twoFactorEnabled 
          ? "Two-factor authentication has been disabled."
          : "Two-factor authentication has been enabled.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update two-factor authentication. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSettingUp2FA(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Session terminated",
        description: "The session has been successfully terminated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to terminate session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getPasswordStrength = (password: string): { score: number; text: string; color: string } => {
    if (password.length === 0) return { score: 0, text: "", color: "" };
    if (password.length < 6) return { score: 1, text: "Weak", color: "text-red-500" };
    if (password.length < 10) return { score: 2, text: "Fair", color: "text-yellow-500" };
    if (password.length < 12) return { score: 3, text: "Good", color: "text-blue-500" };
    return { score: 4, text: "Strong", color: "text-green-500" };
  };

  const passwordStrength = getPasswordStrength(passwords.new);

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  placeholder="Enter your current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Enter your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwords.new && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        passwordStrength.score === 1 ? 'w-1/4 bg-red-500' :
                        passwordStrength.score === 2 ? 'w-2/4 bg-yellow-500' :
                        passwordStrength.score === 3 ? 'w-3/4 bg-blue-500' :
                        passwordStrength.score === 4 ? 'w-full bg-green-500' : 'w-0'
                      }`}
                    />
                  </div>
                  <span className={`text-sm ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Confirm your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? "Changing Password..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Two-Factor Authentication</span>
                {twoFactorEnabled ? (
                  <Badge variant="success" className="bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <XCircle className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {twoFactorEnabled 
                  ? "Your account is protected with 2FA"
                  : "Enable 2FA to add an extra layer of security"
                }
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
              disabled={settingUp2FA}
            />
          </div>

          {twoFactorEnabled && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Recovery Codes</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Save these recovery codes in a safe place. You can use them to access your account if you lose your 2FA device.
              </p>
              <Button variant="outline" size="sm">
                Download Recovery Codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage devices that are currently signed in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span className="font-medium">{session.device}</span>
                    {session.current && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Current session
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {session.location}
                    </div>
                    <span>IP: {session.ipAddress}</span>
                    <span>Last active: {session.lastActive.toLocaleString()}</span>
                  </div>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTerminateSession(session.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Terminate
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Activity
          </CardTitle>
          <CardDescription>
            Recent security-related activity on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                {activity.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{activity.action}</span>
                    {!activity.success && (
                      <Badge variant="destructive" className="text-xs">
                        Failed
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.device} • {activity.location} • {activity.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}