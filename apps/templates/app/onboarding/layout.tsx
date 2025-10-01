"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Progress } from "@midday/ui/progress";
import { Button } from "@midday/ui/button";
import { Skip, ArrowRight } from "lucide-react";
import { onboardingAPI, type OnboardingProgress } from "@/lib/mock/onboarding-mock";
import { authAPI } from "@/lib/mock/auth-mock";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      if (!currentUser) return;

      let userProgress = await onboardingAPI.getProgress(currentUser.id);
      if (!userProgress) {
        userProgress = await onboardingAPI.initializeOnboarding(currentUser.id);
      }
      setProgress(userProgress);
    } catch (error) {
      console.error("Failed to load onboarding progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = () => {
    if (!progress) return null;
    const stepId = pathname.split("/").pop();
    return progress.steps.find(step => step.id === stepId);
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return onboardingAPI.calculateProgress(progress);
  };

  const currentStep = getCurrentStep();
  const progressPercentage = getProgressPercentage();
  const stepNumber = currentStep ? currentStep.order : 1;
  const totalSteps = progress?.steps.length || 6;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      
      {/* Header with progress */}
      <header className="relative z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">Templates</span>
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
            </div>
            
            {currentStep && !currentStep.required && (
              <Button variant="ghost" size="sm">
                <Skip className="h-4 w-4 mr-2" />
                Skip this step
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {currentStep ? currentStep.title : "Setup Progress"}
              </span>
              <span className="text-muted-foreground">
                Step {stepNumber} of {totalSteps}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressPercentage}% complete</span>
              <span>{totalSteps - stepNumber} steps remaining</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-6">
        <p className="text-sm text-muted-foreground">
          Need help? Contact us at{" "}
          <a href="mailto:support@templates.com" className="text-primary hover:underline">
            support@templates.com
          </a>
        </p>
      </footer>
    </div>
  );
}