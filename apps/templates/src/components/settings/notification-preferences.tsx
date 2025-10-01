"use client";

import { useState, useEffect } from "react";
import { Button } from "@midday/ui/button";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Users, 
  Shield, 
  TrendingUp, 
  Calendar,
  Smartphone
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { onboardingAPI, type UserProfile, type UserPreferences } from "@/lib/mock/onboarding-mock";

interface NotificationSettings {
  email: {
    marketing: boolean;
    updates: boolean;
    security: boolean;
    teamActivity: boolean;
    comments: boolean;
    mentions: boolean;
    reminders: boolean;
  };
  push: {
    enabled: boolean;
    mentions: boolean;
    comments: boolean;
    teamActivity: boolean;
    reminders: boolean;
  };
  digest: {
    frequency: "never" | "daily" | "weekly" | "monthly";
    time: "09:00" | "12:00" | "18:00";
  };
}

interface NotificationPreferencesProps {
  user?: MockUser | null;
  profile?: UserProfile | null;
  onUpdate?: (settings: NotificationSettings) => void;
}

export function NotificationPreferences({ user, profile, onUpdate }: NotificationPreferencesProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      marketing: true,
      updates: true,
      security: true,
      teamActivity: true,
      comments: true,
      mentions: true,
      reminders: true,
    },
    push: {
      enabled: false,
      mentions: true,
      comments: false,
      teamActivity: false,
      reminders: true,
    },
    digest: {
      frequency: "weekly",
      time: "09:00",
    },
  });
  
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.preferences.emailNotifications) {
      setSettings(prev => ({
        ...prev,
        email: {
          ...prev.email,
          marketing: profile.preferences.emailNotifications.marketing,
          updates: profile.preferences.emailNotifications.updates,
          security: profile.preferences.emailNotifications.security,
          teamActivity: profile.preferences.emailNotifications.teamActivity,
        },
      }));
    }
  }, [profile]);

  const updateEmailSetting = (key: keyof NotificationSettings['email'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
  };

  const updatePushSetting = (key: keyof NotificationSettings['push'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      push: { ...prev.push, [key]: value },
    }));
  };

  const updateDigestSetting = (key: keyof NotificationSettings['digest'], value: string) => {
    setSettings(prev => ({
      ...prev,
      digest: { ...prev.digest, [key]: value },
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update preferences in the backend
      await onboardingAPI.updatePreferences(user.id, {
        emailNotifications: settings.email,
      });

      onUpdate?.(settings);

      toast({
        title: "Notifications updated",
        description: "Your notification preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const emailNotifications = [
    {
      key: "marketing" as const,
      icon: TrendingUp,
      title: "Marketing & Promotions",
      description: "Product updates, new features, and promotional content",
    },
    {
      key: "updates" as const,
      icon: Bell,
      title: "Product Updates",
      description: "Important announcements about new features and improvements",
    },
    {
      key: "security" as const,
      icon: Shield,
      title: "Security Alerts",
      description: "Login attempts, password changes, and security-related notifications",
    },
    {
      key: "teamActivity" as const,
      icon: Users,
      title: "Team Activity",
      description: "Updates about your team members and collaborative activities",
    },
    {
      key: "comments" as const,
      icon: MessageSquare,
      title: "Comments & Replies",
      description: "When someone comments on your posts or replies to your comments",
    },
    {
      key: "mentions" as const,
      icon: Mail,
      title: "Mentions",
      description: "When someone mentions you in a comment or discussion",
    },
    {
      key: "reminders" as const,
      icon: Calendar,
      title: "Reminders",
      description: "Task deadlines, meeting reminders, and scheduled notifications",
    },
  ];

  const pushNotifications = [
    {
      key: "mentions" as const,
      title: "Mentions",
      description: "When someone mentions you",
    },
    {
      key: "comments" as const,
      title: "Comments",
      description: "New comments on your content",
    },
    {
      key: "teamActivity" as const,
      title: "Team Activity",
      description: "Updates from your team",
    },
    {
      key: "reminders" as const,
      title: "Reminders",
      description: "Task and meeting reminders",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which email notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailNotifications.map((notification) => (
            <div key={notification.key} className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-muted">
                  <notification.icon className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`email-${notification.key}`} className="font-medium">
                    {notification.title}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {notification.description}
                  </p>
                </div>
              </div>
              <Switch
                id={`email-${notification.key}`}
                checked={settings.email[notification.key]}
                onCheckedChange={(checked) => updateEmailSetting(notification.key, checked)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Manage push notifications for mobile and desktop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label htmlFor="push-enabled" className="font-medium">
                Enable Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Allow this application to send you push notifications
              </p>
            </div>
            <Switch
              id="push-enabled"
              checked={settings.push.enabled}
              onCheckedChange={(checked) => updatePushSetting('enabled', checked)}
            />
          </div>

          {settings.push.enabled && (
            <div className="space-y-4 pl-4 border-l-2 border-muted">
              {pushNotifications.map((notification) => (
                <div key={notification.key} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor={`push-${notification.key}`} className="font-medium">
                      {notification.title}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {notification.description}
                    </p>
                  </div>
                  <Switch
                    id={`push-${notification.key}`}
                    checked={settings.push[notification.key]}
                    onCheckedChange={(checked) => updatePushSetting(notification.key, checked)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Digest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Email Digest
          </CardTitle>
          <CardDescription>
            Receive a summary of your activity and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="digest-frequency">Frequency</Label>
              <Select
                value={settings.digest.frequency}
                onValueChange={(value) => updateDigestSetting('frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.digest.frequency !== "never" && (
              <div className="space-y-2">
                <Label htmlFor="digest-time">Delivery Time</Label>
                <Select
                  value={settings.digest.time}
                  onValueChange={(value) => updateDigestSetting('time', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="12:00">12:00 PM</SelectItem>
                    <SelectItem value="18:00">6:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {settings.digest.frequency !== "never" && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                You'll receive a {settings.digest.frequency} digest at {" "}
                {settings.digest.time === "09:00" ? "9:00 AM" :
                 settings.digest.time === "12:00" ? "12:00 PM" : "6:00 PM"} with 
                a summary of your notifications and activity.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage all notifications at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSettings(prev => ({
                  ...prev,
                  email: Object.keys(prev.email).reduce((acc, key) => ({
                    ...acc,
                    [key]: true,
                  }), {} as NotificationSettings['email']),
                }));
              }}
            >
              Enable All Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSettings(prev => ({
                  ...prev,
                  email: Object.keys(prev.email).reduce((acc, key) => ({
                    ...acc,
                    [key]: key === 'security', // Keep security notifications enabled
                  }), {} as NotificationSettings['email']),
                }));
              }}
            >
              Disable All Email
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Security notifications cannot be disabled for account safety.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}