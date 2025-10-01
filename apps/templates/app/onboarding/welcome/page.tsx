"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@midday/ui/button";
import { Card, CardContent } from "@midday/ui/card";
import { useToast } from "@midday/ui/use-toast";
import { 
  ArrowRight, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  Sparkles 
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { onboardingAPI } from "@/lib/mock/onboarding-mock";

export default function WelcomePage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  };

  const handleGetStarted = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      await onboardingAPI.completeStep(user.id, "welcome");
      router.push("/onboarding/profile");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to proceed to next step",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team members seamlessly",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Get detailed insights about your business performance",
    },
    {
      icon: Settings,
      title: "Powerful Integrations",
      description: "Connect with your favorite tools and services",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Your data is protected with enterprise-grade security",
    },
  ];

  return (
    <div className="text-center space-y-8">
      {/* Welcome header */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">
            Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto">
            We're excited to have you on board. Let's get you set up with everything you need to succeed.
          </p>
        </div>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
        {features.map((feature, index) => (
          <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* What's next */}
      <div className="bg-muted/50 rounded-lg p-6 text-left">
        <h3 className="font-semibold mb-3">What's coming up:</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span>Complete your profile information</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
            <span>Create or join a team</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
            <span>Set your preferences</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
            <span>Connect your integrations</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <Button 
          onClick={handleGetStarted}
          size="lg"
          className="px-8"
          disabled={loading}
        >
          {loading ? (
            "Loading..."
          ) : (
            <>
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          This should only take a few minutes to complete
        </p>
      </div>
    </div>
  );
}