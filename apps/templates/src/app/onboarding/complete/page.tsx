"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@midday/ui/button";
import { Card, CardContent } from "@midday/ui/card";
import { 
  ArrowRight, 
  CheckCircle2, 
  Users, 
  BarChart3, 
  Settings, 
  CreditCard,
  FileText,
  Zap,
  Star
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { onboardingAPI } from "@/lib/mock/onboarding-mock";
import { Confetti } from "@/components/onboarding/confetti";

export default function CompletePage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    // Trigger confetti after a short delay
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Mark onboarding as complete
        await onboardingAPI.completeStep(currentUser.id, "complete");
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push("/");
  };

  const quickTips = [
    {
      icon: Users,
      title: "Invite team members",
      description: "Add your colleagues and start collaborating",
      action: "Go to Teams",
      href: "/teams",
    },
    {
      icon: BarChart3,
      title: "View analytics",
      description: "Track your progress with detailed insights",
      action: "View Charts",
      href: "/charts",
    },
    {
      icon: Settings,
      title: "Customize settings",
      description: "Personalize your workspace preferences",
      action: "Open Settings",
      href: "/settings",
    },
    {
      icon: CreditCard,
      title: "Manage billing",
      description: "Review your plan and payment methods",
      action: "View Billing",
      href: "/billing",
    },
  ];

  const keyFeatures = [
    {
      icon: FileText,
      title: "Document Management",
      description: "Organize and share files with your team",
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Streamline workflows with powerful automations",
    },
    {
      icon: Star,
      title: "Premium Support",
      description: "Get help when you need it with priority support",
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing setup...</p>
      </div>
    );
  }

  return (
    <>
      <Confetti active={showConfetti} duration={4000} particleCount={80} />
      
      <div className="text-center space-y-8">
        {/* Success Header */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center animate-pulse">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">
              🎉 Welcome aboard{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              You're all set! Your account is ready and you can start exploring all the features we have to offer.
            </p>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Quick tips to get started</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickTips.map((tip, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <tip.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {tip.description}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-auto p-0 text-primary hover:text-primary"
                        onClick={() => router.push(tip.href)}
                      >
                        {tip.action} <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Key features you'll love</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {keyFeatures.map((feature, index) => (
              <Card key={index} className="border">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
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
        </div>

        {/* Success Message */}
        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-6 text-left">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">Setup Complete!</h3>
              <p className="text-sm text-green-700 dark:text-green-200">
                Your account has been successfully configured with your preferences. 
                You can always update these settings later from your account preferences.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <Button 
            onClick={handleGoToDashboard}
            size="lg"
            className="px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <p className="text-xs text-muted-foreground">
            You can access these tips anytime from the help section
          </p>
        </div>

        {/* Fun Stats */}
        <div className="bg-muted/50 rounded-lg p-6">
          <p className="text-sm text-muted-foreground mb-3">
            Fun fact: You're one of{" "}
            <span className="font-semibold text-foreground">50,000+</span>{" "}
            users who have completed their setup this month! 🚀
          </p>
          <div className="flex justify-center gap-6 text-xs">
            <div className="text-center">
              <div className="font-semibold text-lg">2.5M+</div>
              <div className="text-muted-foreground">Documents created</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">120K+</div>
              <div className="text-muted-foreground">Teams using our platform</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-lg">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}