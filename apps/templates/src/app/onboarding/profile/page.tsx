"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@midday/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { 
  ArrowRight, 
  Upload, 
  User, 
  Globe, 
  Clock,
  Twitter,
  Linkedin,
  Github,
  ExternalLink
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { onboardingAPI, type UserProfile } from "@/lib/mock/onboarding-mock";

export default function ProfilePage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    timezone: "",
    socialLinks: {
      twitter: "",
      linkedin: "",
      github: "",
      website: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      if (!currentUser) return;

      setUser(currentUser);
      
      // Load existing profile or create default
      let userProfile = await onboardingAPI.getUserProfile(currentUser.id);
      if (!userProfile) {
        userProfile = await onboardingAPI.updateUserProfile(currentUser.id, {
          timezone: "UTC",
          socialLinks: {},
          preferences: {
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
          },
        });
      }
      
      setProfile(userProfile);
      setFormData({
        fullName: currentUser.fullName,
        bio: userProfile.bio || "",
        timezone: userProfile.timezone,
        socialLinks: userProfile.socialLinks,
      });
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setLoading(true);
    
    try {
      // Update user name
      if (formData.fullName !== user.fullName) {
        await authAPI.updateUser(user.id, { fullName: formData.fullName });
      }

      // Update profile
      await onboardingAPI.updateUserProfile(user.id, {
        bio: formData.bio,
        timezone: formData.timezone,
        socialLinks: formData.socialLinks,
      });

      // Complete onboarding step
      await onboardingAPI.completeStep(user.id, "profile");
      
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      });
      
      router.push("/onboarding/team");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const timezones = onboardingAPI.getTimezones();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Complete your profile</h1>
        <p className="text-muted-foreground">
          Tell us a bit about yourself to personalize your experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar and basic info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar upload */}
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="text-lg">
                  {user?.fullName ? getInitials(user.fullName) : "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload photo
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or GIF. Max size 2MB.
                </p>
              </div>
            </div>

            {/* Full name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Brief description for your profile
              </p>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone">
                <Clock className="h-4 w-4 inline mr-2" />
                Timezone
              </Label>
              <Select 
                value={formData.timezone} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Social links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Social Links (optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Twitter */}
              <div className="space-y-2">
                <Label htmlFor="twitter">
                  <Twitter className="h-4 w-4 inline mr-2" />
                  Twitter
                </Label>
                <Input
                  id="twitter"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                  }))}
                  placeholder="https://twitter.com/username"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="linkedin">
                  <Linkedin className="h-4 w-4 inline mr-2" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                  }))}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <Label htmlFor="github">
                  <Github className="h-4 w-4 inline mr-2" />
                  GitHub
                </Label>
                <Input
                  id="github"
                  value={formData.socialLinks.github}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, github: e.target.value }
                  }))}
                  placeholder="https://github.com/username"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">
                  <ExternalLink className="h-4 w-4 inline mr-2" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={formData.socialLinks.website}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    socialLinks: { ...prev.socialLinks, website: e.target.value }
                  }))}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? (
              "Saving..."
            ) : (
              <>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}