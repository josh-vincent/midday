"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { onboardingAPI, type UserProfile } from "@/lib/mock/onboarding-mock";
import { NotificationPreferences } from "@/components/settings/notification-preferences";

export default function NotificationsPage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const userProfile = await onboardingAPI.getUserProfile(currentUser.id);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading notification settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your email, push, and digest notification preferences.
        </p>
      </div>

      {/* Notification Preferences */}
      <NotificationPreferences user={user} profile={profile} />
    </div>
  );
}