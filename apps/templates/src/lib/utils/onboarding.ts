import { onboardingAPI, type OnboardingProgress, type OnboardingStep } from "@/lib/mock/onboarding-mock";

// Onboarding progress management
export class OnboardingManager {
  private static instance: OnboardingManager;
  private currentProgress: OnboardingProgress | null = null;
  private listeners: Array<(progress: OnboardingProgress | null) => void> = [];

  static getInstance(): OnboardingManager {
    if (!OnboardingManager.instance) {
      OnboardingManager.instance = new OnboardingManager();
    }
    return OnboardingManager.instance;
  }

  // Subscribe to progress changes
  subscribe(listener: (progress: OnboardingProgress | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of progress change
  private notify() {
    this.listeners.forEach(listener => listener(this.currentProgress));
  }

  // Initialize progress for user
  async initialize(userId: string) {
    try {
      let progress = await onboardingAPI.getProgress(userId);
      if (!progress) {
        progress = await onboardingAPI.initializeOnboarding(userId);
      }
      
      this.currentProgress = progress;
      this.notify();
      return progress;
    } catch (error) {
      console.error("Failed to initialize onboarding:", error);
      this.currentProgress = null;
      this.notify();
      return null;
    }
  }

  // Complete a step
  async completeStep(userId: string, stepId: string) {
    try {
      const progress = await onboardingAPI.completeStep(userId, stepId);
      this.currentProgress = progress;
      this.notify();
      return progress;
    } catch (error) {
      console.error("Failed to complete step:", error);
      throw error;
    }
  }

  // Skip a step
  async skipStep(userId: string, stepId: string) {
    try {
      const progress = await onboardingAPI.skipStep(userId, stepId);
      this.currentProgress = progress;
      this.notify();
      return progress;
    } catch (error) {
      console.error("Failed to skip step:", error);
      throw error;
    }
  }

  // Go to specific step
  async goToStep(userId: string, stepId: string) {
    try {
      const progress = await onboardingAPI.goToStep(userId, stepId);
      this.currentProgress = progress;
      this.notify();
      return progress;
    } catch (error) {
      console.error("Failed to go to step:", error);
      throw error;
    }
  }

  // Get current progress
  getCurrentProgress(): OnboardingProgress | null {
    return this.currentProgress;
  }

  // Get current step
  getCurrentStep(): OnboardingStep | null {
    if (!this.currentProgress) return null;
    return this.currentProgress.steps.find(step => step.id === this.currentProgress!.currentStepId) || null;
  }

  // Get next step
  getNextStep(): OnboardingStep | null {
    if (!this.currentProgress) return null;
    return onboardingAPI.getNextStep(this.currentProgress);
  }

  // Check if onboarding is complete
  isComplete(): boolean {
    if (!this.currentProgress) return false;
    return onboardingAPI.isOnboardingComplete(this.currentProgress);
  }

  // Get progress percentage
  getProgressPercentage(): number {
    if (!this.currentProgress) return 0;
    return onboardingAPI.calculateProgress(this.currentProgress);
  }
}

// Step navigation utilities
export const getStepRoute = (stepId: string): string => {
  return `/onboarding/${stepId}`;
};

export const getNextStepRoute = (currentStepId: string, steps: OnboardingStep[]): string | null => {
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  if (currentIndex === -1 || currentIndex === steps.length - 1) return null;
  
  const nextStep = steps[currentIndex + 1];
  return getStepRoute(nextStep.id);
};

export const getPreviousStepRoute = (currentStepId: string, steps: OnboardingStep[]): string | null => {
  const currentIndex = steps.findIndex(step => step.id === currentStepId);
  if (currentIndex <= 0) return null;
  
  const previousStep = steps[currentIndex - 1];
  return getStepRoute(previousStep.id);
};

// Progress calculation utilities
export const calculateStepProgress = (steps: OnboardingStep[]): {
  completed: number;
  total: number;
  percentage: number;
} => {
  const completed = steps.filter(step => step.completed).length;
  const total = steps.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { completed, total, percentage };
};

export const getRequiredSteps = (steps: OnboardingStep[]): OnboardingStep[] => {
  return steps.filter(step => step.required);
};

export const getOptionalSteps = (steps: OnboardingStep[]): OnboardingStep[] => {
  return steps.filter(step => !step.required);
};

export const getIncompleteSteps = (steps: OnboardingStep[], skippedSteps: string[]): OnboardingStep[] => {
  return steps.filter(step => !step.completed && !skippedSteps.includes(step.id));
};

// Validation utilities
export const validateStepCompletion = (stepId: string, data: any): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];

  switch (stepId) {
    case "welcome":
      // No validation needed for welcome step
      break;
      
    case "profile":
      if (!data.fullName?.trim()) {
        errors.push("Full name is required");
      }
      if (!data.timezone) {
        errors.push("Timezone is required");
      }
      break;
      
    case "team":
      // Team step is optional, so no strict validation
      break;
      
    case "preferences":
      if (!data.theme) {
        errors.push("Theme preference is required");
      }
      if (!data.language) {
        errors.push("Language preference is required");
      }
      break;
      
    case "integrations":
      // Integrations are optional
      break;
      
    case "complete":
      // No validation needed for completion step
      break;
      
    default:
      errors.push("Unknown step");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Step metadata
export const getStepMetadata = (stepId: string): {
  title: string;
  description: string;
  estimatedTime: string;
  isRequired: boolean;
} => {
  const metadata = {
    welcome: {
      title: "Welcome",
      description: "Welcome to our platform! Let's get you started.",
      estimatedTime: "1 min",
      isRequired: true,
    },
    profile: {
      title: "Complete Your Profile",
      description: "Add your personal information and avatar.",
      estimatedTime: "3-5 min",
      isRequired: true,
    },
    team: {
      title: "Create or Join a Team",
      description: "Set up your team or join an existing one.",
      estimatedTime: "2-3 min",
      isRequired: false,
    },
    preferences: {
      title: "Set Your Preferences",
      description: "Customize your experience with theme and notification settings.",
      estimatedTime: "2 min",
      isRequired: false,
    },
    integrations: {
      title: "Connect Integrations",
      description: "Connect your favorite tools and services.",
      estimatedTime: "5-10 min",
      isRequired: false,
    },
    complete: {
      title: "All Set!",
      description: "You're ready to start using our platform.",
      estimatedTime: "1 min",
      isRequired: true,
    },
  };

  return metadata[stepId as keyof typeof metadata] || {
    title: "Unknown Step",
    description: "Unknown step",
    estimatedTime: "Unknown",
    isRequired: false,
  };
};

// Progress persistence
export const saveProgress = (progress: OnboardingProgress) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(`onboarding_progress_${progress.userId}`, JSON.stringify(progress));
  }
};

export const loadProgress = (userId: string): OnboardingProgress | null => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(`onboarding_progress_${userId}`);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

export const clearProgress = (userId: string) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(`onboarding_progress_${userId}`);
  }
};

// Analytics and tracking
export const trackStepViewed = (stepId: string, userId: string) => {
  // In a real app, this would send analytics events
  console.log(`Step viewed: ${stepId} by user ${userId}`);
};

export const trackStepCompleted = (stepId: string, userId: string, timeSpent?: number) => {
  // In a real app, this would send analytics events
  console.log(`Step completed: ${stepId} by user ${userId}${timeSpent ? ` in ${timeSpent}ms` : ""}`);
};

export const trackStepSkipped = (stepId: string, userId: string, reason?: string) => {
  // In a real app, this would send analytics events
  console.log(`Step skipped: ${stepId} by user ${userId}${reason ? ` reason: ${reason}` : ""}`);
};

export const trackOnboardingCompleted = (userId: string, totalTime: number, stepsCompleted: number, stepsSkipped: number) => {
  // In a real app, this would send analytics events
  console.log(`Onboarding completed by user ${userId}: ${totalTime}ms, ${stepsCompleted} completed, ${stepsSkipped} skipped`);
};

// Error handling
export class OnboardingError extends Error {
  constructor(message: string, public stepId?: string, public code?: string) {
    super(message);
    this.name = "OnboardingError";
  }
}

export const handleOnboardingError = (error: unknown): string => {
  if (error instanceof OnboardingError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred during onboarding";
};