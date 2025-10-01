import { authAPI, type MockUser, type MockSession } from "@/lib/mock/auth-mock";

// Auth state management
export class AuthManager {
  private static instance: AuthManager;
  private currentUser: MockUser | null = null;
  private currentSession: MockSession | null = null;
  private listeners: Array<(user: MockUser | null) => void> = [];

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // Subscribe to auth state changes
  subscribe(listener: (user: MockUser | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of auth state change
  private notify() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  // Initialize auth state
  async initialize() {
    try {
      const session = await authAPI.getCurrentSession();
      const user = await authAPI.getCurrentUser();
      
      this.currentSession = session;
      this.currentUser = user;
      this.notify();
      
      return { user, session };
    } catch (error) {
      this.currentUser = null;
      this.currentSession = null;
      this.notify();
      return { user: null, session: null };
    }
  }

  // Login
  async login(email: string, password: string) {
    const result = await authAPI.login(email, password);
    if (result) {
      this.currentUser = result.user;
      this.currentSession = result.session;
      this.notify();
    }
    return result;
  }

  // Social login
  async socialLogin(provider: 'google' | 'github') {
    const result = provider === 'google' 
      ? await authAPI.loginWithGoogle()
      : await authAPI.loginWithGitHub();
    
    this.currentUser = result.user;
    this.currentSession = result.session;
    this.notify();
    return result;
  }

  // Signup
  async signup(email: string, password: string, fullName: string) {
    const user = await authAPI.signup(email, password, fullName);
    // Don't set current user until email is verified
    return user;
  }

  // Logout
  async logout() {
    await authAPI.logout();
    this.currentUser = null;
    this.currentSession = null;
    this.notify();
  }

  // Get current user
  getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  // Get current session
  getCurrentSession(): MockSession | null {
    return this.currentSession;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentSession !== null;
  }

  // Check if user needs onboarding
  needsOnboarding(): boolean {
    return this.currentUser ? !this.currentUser.onboardingCompleted : false;
  }

  // Check if email is verified
  isEmailVerified(): boolean {
    return this.currentUser ? this.currentUser.emailVerified : false;
  }

  // Update user data
  async updateUser(updates: Partial<MockUser>) {
    if (!this.currentUser) return null;
    
    const updatedUser = await authAPI.updateUser(this.currentUser.id, updates);
    this.currentUser = updatedUser;
    this.notify();
    return updatedUser;
  }
}

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  let label: string;
  let color: string;
  
  if (score < 40) {
    label = "Weak";
    color = "text-red-600";
  } else if (score < 70) {
    label = "Medium";
    color = "text-yellow-600";
  } else {
    label = "Strong";
    color = "text-green-600";
  }

  return { score, label, color };
};

// Auth hooks for React components
export const useAuth = () => {
  const authManager = AuthManager.getInstance();
  return {
    user: authManager.getCurrentUser(),
    session: authManager.getCurrentSession(),
    isAuthenticated: authManager.isAuthenticated(),
    needsOnboarding: authManager.needsOnboarding(),
    isEmailVerified: authManager.isEmailVerified(),
    login: authManager.login.bind(authManager),
    socialLogin: authManager.socialLogin.bind(authManager),
    signup: authManager.signup.bind(authManager),
    logout: authManager.logout.bind(authManager),
    updateUser: authManager.updateUser.bind(authManager),
    subscribe: authManager.subscribe.bind(authManager),
  };
};

// Route protection utilities
export const requireAuth = (user: MockUser | null): boolean => {
  return user !== null;
};

export const requireEmailVerification = (user: MockUser | null): boolean => {
  return user !== null && user.emailVerified;
};

export const requireOnboarding = (user: MockUser | null): boolean => {
  return user !== null && user.emailVerified && !user.onboardingCompleted;
};

export const redirectPath = (user: MockUser | null): string => {
  if (!user) return "/auth/login";
  if (!user.emailVerified) return "/auth/verify-email";
  if (!user.onboardingCompleted) return "/onboarding/welcome";
  return "/";
};

// Storage utilities for session persistence
export const saveSession = (session: MockSession) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_session", JSON.stringify(session));
  }
};

export const loadSession = (): MockSession | null => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("auth_session");
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

export const clearSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_session");
  }
};

// Error handling
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "AuthError";
  }
}

export const handleAuthError = (error: unknown): string => {
  if (error instanceof AuthError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return "An unexpected error occurred";
};