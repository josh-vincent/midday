"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { onboardingAPI, type UserProfile } from "@/lib/mock/onboarding-mock";
import { ProfileForm } from "@/components/settings/profile-form";

export default function ProfilePage() {
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

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your profile information and public details.
        </p>
      </div>

      {/* Profile Form */}
      <ProfileForm 
        user={user} 
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}