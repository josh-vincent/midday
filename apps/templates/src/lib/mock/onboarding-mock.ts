export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  order: number;
  required: boolean;
  route: string;
}

export interface OnboardingProgress {
  userId: string;
  steps: OnboardingStep[];
  currentStepId: string;
  completedAt?: Date;
  skippedSteps: string[];
  startedAt: Date;
  lastUpdated: Date;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  emailNotifications: {
    marketing: boolean;
    updates: boolean;
    security: boolean;
    teamActivity: boolean;
  };
}

export interface UserProfile {
  userId: string;
  bio?: string;
  timezone: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  preferences: UserPreferences;
}

// Default onboarding steps
const defaultSteps: Omit<OnboardingStep, "completed">[] = [
  {
    id: "welcome",
    title: "Welcome",
    description: "Welcome to our platform! Let's get you started.",
    order: 1,
    required: true,
    route: "/onboarding/welcome",
  },
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Add your personal information and avatar.",
    order: 2,
    required: true,
    route: "/onboarding/profile",
  },
  {
    id: "team",
    title: "Create or Join a Team",
    description: "Set up your team or join an existing one.",
    order: 3,
    required: false,
    route: "/onboarding/team",
  },
  {
    id: "preferences",
    title: "Set Your Preferences",
    description: "Customize your experience with theme and notification settings.",
    order: 4,
    required: false,
    route: "/onboarding/preferences",
  },
  {
    id: "integrations",
    title: "Connect Integrations",
    description: "Connect your favorite tools and services.",
    order: 5,
    required: false,
    route: "/onboarding/integrations",
  },
  {
    id: "complete",
    title: "All Set!",
    description: "You're ready to start using our platform.",
    order: 6,
    required: true,
    route: "/onboarding/complete",
  },
];

// Mock data storage
const userProgressMap = new Map<string, OnboardingProgress>();
const userProfilesMap = new Map<string, UserProfile>();

// Initialize with some sample data
const sampleProgress: OnboardingProgress = {
  userId: "user_1",
  steps: defaultSteps.map(step => ({ ...step, completed: true })),
  currentStepId: "complete",
  completedAt: new Date("2024-01-16"),
  skippedSteps: [],
  startedAt: new Date("2024-01-15"),
  lastUpdated: new Date("2024-01-16"),
};

const sampleProfile: UserProfile = {
  userId: "user_1",
  bio: "Product manager with a passion for building great user experiences.",
  timezone: "America/New_York",
  socialLinks: {
    twitter: "https://twitter.com/johndoe",
    linkedin: "https://linkedin.com/in/johndoe",
    github: "https://github.com/johndoe",
  },
  preferences: {
    theme: "system",
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    emailNotifications: {
      marketing: false,
      updates: true,
      security: true,
      teamActivity: true,
    },
  },
};

userProgressMap.set("user_1", sampleProgress);
userProfilesMap.set("user_1", sampleProfile);

export const onboardingAPI = {
  // Get onboarding progress for a user
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    return userProgressMap.get(userId) || null;
  },

  // Initialize onboarding for a new user
  async initializeOnboarding(userId: string): Promise<OnboardingProgress> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    const progress: OnboardingProgress = {
      userId,
      steps: defaultSteps.map(step => ({ ...step, completed: false })),
      currentStepId: "welcome",
      skippedSteps: [],
      startedAt: new Date(),
      lastUpdated: new Date(),
    };

    userProgressMap.set(userId, progress);
    return progress;
  },

  // Mark a step as completed
  async completeStep(userId: string, stepId: string): Promise<OnboardingProgress> {
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
    
    const progress = userProgressMap.get(userId);
    if (!progress) {
      throw new Error("Onboarding not initialized for this user");
    }

    const step = progress.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    step.completed = true;
    progress.lastUpdated = new Date();

    // Move to next step
    const currentStepIndex = progress.steps.findIndex(s => s.id === stepId);
    const nextStep = progress.steps[currentStepIndex + 1];
    
    if (nextStep) {
      progress.currentStepId = nextStep.id;
    } else {
      // All steps completed
      progress.completedAt = new Date();
      progress.currentStepId = "complete";
    }

    userProgressMap.set(userId, progress);
    return progress;
  },

  // Skip a step (only for non-required steps)
  async skipStep(userId: string, stepId: string): Promise<OnboardingProgress> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    const progress = userProgressMap.get(userId);
    if (!progress) {
      throw new Error("Onboarding not initialized for this user");
    }

    const step = progress.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    if (step.required) {
      throw new Error("Cannot skip required step");
    }

    if (!progress.skippedSteps.includes(stepId)) {
      progress.skippedSteps.push(stepId);
    }
    
    progress.lastUpdated = new Date();

    // Move to next step
    const currentStepIndex = progress.steps.findIndex(s => s.id === stepId);
    const nextStep = progress.steps[currentStepIndex + 1];
    
    if (nextStep) {
      progress.currentStepId = nextStep.id;
    } else {
      // All steps completed/skipped
      progress.completedAt = new Date();
      progress.currentStepId = "complete";
    }

    userProgressMap.set(userId, progress);
    return progress;
  },

  // Go to a specific step
  async goToStep(userId: string, stepId: string): Promise<OnboardingProgress> {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
    
    const progress = userProgressMap.get(userId);
    if (!progress) {
      throw new Error("Onboarding not initialized for this user");
    }

    const step = progress.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    progress.currentStepId = stepId;
    progress.lastUpdated = new Date();

    userProgressMap.set(userId, progress);
    return progress;
  },

  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    return userProfilesMap.get(userId) || null;
  },

  // Create or update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    const existingProfile = userProfilesMap.get(userId) || {
      userId,
      timezone: "UTC",
      socialLinks: {},
      preferences: {
        theme: "system" as const,
        language: "en",
        timezone: "UTC",
        dateFormat: "MM/DD/YYYY" as const,
        emailNotifications: {
          marketing: true,
          updates: true,
          security: true,
          teamActivity: true,
        },
      },
    };

    const updatedProfile = { ...existingProfile, ...updates };
    userProfilesMap.set(userId, updatedProfile);
    return updatedProfile;
  },

  // Update user preferences
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserProfile> {
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
    
    const profile = userProfilesMap.get(userId);
    if (!profile) {
      throw new Error("User profile not found");
    }

    profile.preferences = { ...profile.preferences, ...preferences };
    userProfilesMap.set(userId, profile);
    return profile;
  },

  // Calculate progress percentage
  calculateProgress(progress: OnboardingProgress): number {
    const completedSteps = progress.steps.filter(s => s.completed).length;
    const skippedSteps = progress.skippedSteps.length;
    const totalSteps = progress.steps.length;
    
    return Math.round(((completedSteps + skippedSteps) / totalSteps) * 100);
  },

  // Check if onboarding is complete
  isOnboardingComplete(progress: OnboardingProgress): boolean {
    const requiredSteps = progress.steps.filter(s => s.required);
    return requiredSteps.every(s => s.completed);
  },

  // Get next step to complete
  getNextStep(progress: OnboardingProgress): OnboardingStep | null {
    const incompleteSteps = progress.steps.filter(
      s => !s.completed && !progress.skippedSteps.includes(s.id)
    );
    
    return incompleteSteps.length > 0 ? incompleteSteps[0] : null;
  },

  // Reset onboarding progress
  async resetOnboarding(userId: string): Promise<OnboardingProgress> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    const progress: OnboardingProgress = {
      userId,
      steps: defaultSteps.map(step => ({ ...step, completed: false })),
      currentStepId: "welcome",
      skippedSteps: [],
      startedAt: new Date(),
      lastUpdated: new Date(),
    };

    userProgressMap.set(userId, progress);
    return progress;
  },

  // Available timezones
  getTimezones(): { value: string; label: string }[] {
    return [
      { value: "America/New_York", label: "Eastern Time (ET)" },
      { value: "America/Chicago", label: "Central Time (CT)" },
      { value: "America/Denver", label: "Mountain Time (MT)" },
      { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
      { value: "America/Phoenix", label: "Arizona (MST)" },
      { value: "America/Anchorage", label: "Alaska (AKST)" },
      { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
      { value: "UTC", label: "UTC" },
      { value: "Europe/London", label: "London (GMT/BST)" },
      { value: "Europe/Paris", label: "Paris (CET/CEST)" },
      { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
      { value: "Asia/Tokyo", label: "Tokyo (JST)" },
      { value: "Asia/Shanghai", label: "Shanghai (CST)" },
      { value: "Asia/Kolkata", label: "India (IST)" },
      { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)" },
    ];
  },

  // Available languages
  getLanguages(): { value: string; label: string }[] {
    return [
      { value: "en", label: "English" },
      { value: "es", label: "Español" },
      { value: "fr", label: "Français" },
      { value: "de", label: "Deutsch" },
      { value: "it", label: "Italiano" },
      { value: "pt", label: "Português" },
      { value: "zh", label: "中文" },
      { value: "ja", label: "日本語" },
      { value: "ko", label: "한국어" },
    ];
  },

  // Helper methods for development
  getAllProgress: () => Array.from(userProgressMap.values()),
  getAllProfiles: () => Array.from(userProfilesMap.values()),
  getDefaultSteps: () => defaultSteps,
};