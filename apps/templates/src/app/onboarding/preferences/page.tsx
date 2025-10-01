"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Label } from "@midday/ui/label";
import { Switch } from "@midday/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { 
  ArrowRight, 
  Palette, 
  Bell, 
  Globe, 
  Calendar
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { onboardingAPI, type UserPreferences } from "@/lib/mock/onboarding-mock";

export default function PreferencesPage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: "system",
    language: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    emailNotifications: {
      marketing: true,
      updates: true,
      security: true,
      teamActivity: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await onboardingAPI.getUserProfile(currentUser.id);
        if (userProfile?.preferences) {
          setPreferences(userProfile.preferences);
        }
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!user) return;

    setSaving(true);
    
    try {
      await onboardingAPI.updatePreferences(user.id, preferences);
      await onboardingAPI.completeStep(user.id, "preferences");
      
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated successfully.",
      });
      
      router.push("/onboarding/complete");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateNotificationPreference = (key: keyof UserPreferences['emailNotifications'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Palette className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Set your preferences</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Customize your experience by setting your preferred theme, language, and notification settings.
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-6">
        {/* Theme Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme
            </CardTitle>
            <CardDescription>
              Choose your preferred color theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={preferences.theme} 
              onValueChange={(value: "light" | "dark" | "system") => 
                setPreferences(prev => ({ ...prev, theme: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System (automatic)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Language and Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language & Region
            </CardTitle>
            <CardDescription>
              Set your language and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select 
                value={preferences.language} 
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, language: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {onboardingAPI.getLanguages().map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={preferences.timezone} 
                onValueChange={(value) => 
                  setPreferences(prev => ({ ...prev, timezone: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a timezone" />
                </SelectTrigger>
                <SelectContent>
                  {onboardingAPI.getTimezones().map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Date Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Format
            </CardTitle>
            <CardDescription>
              Choose how dates should be displayed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={preferences.dateFormat} 
              onValueChange={(value: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD") => 
                setPreferences(prev => ({ ...prev, dateFormat: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Choose which email notifications you'd like to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="marketing">Marketing emails</Label>
                <p className="text-sm text-muted-foreground">
                  Product updates, tips, and special offers
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.emailNotifications.marketing}
                onCheckedChange={(checked) => updateNotificationPreference('marketing', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="updates">Product updates</Label>
                <p className="text-sm text-muted-foreground">
                  New features and important announcements
                </p>
              </div>
              <Switch
                id="updates"
                checked={preferences.emailNotifications.updates}
                onCheckedChange={(checked) => updateNotificationPreference('updates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="security">Security alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Login attempts and security-related notifications
                </p>
              </div>
              <Switch
                id="security"
                checked={preferences.emailNotifications.security}
                onCheckedChange={(checked) => updateNotificationPreference('security', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="teamActivity">Team activity</Label>
                <p className="text-sm text-muted-foreground">
                  Updates about your team and collaboration
                </p>
              </div>
              <Switch
                id="teamActivity"
                checked={preferences.emailNotifications.teamActivity}
                onCheckedChange={(checked) => updateNotificationPreference('teamActivity', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <Button 
          onClick={handleSaveAndContinue}
          size="lg"
          className="px-8"
          disabled={saving}
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              Save & Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}