export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted: boolean;
  currentTeamId?: string;
}

export interface MockSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Mock users database
const mockUsers: MockUser[] = [
  {
    id: "user_1",
    email: "john@example.com",
    fullName: "John Doe",
    avatarUrl: "https://avatar.vercel.sh/john",
    emailVerified: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-03-10"),
    onboardingCompleted: true,
    currentTeamId: "team_1",
  },
  {
    id: "user_2",
    email: "jane@example.com",
    fullName: "Jane Smith",
    avatarUrl: "https://avatar.vercel.sh/jane",
    emailVerified: true,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-03-08"),
    onboardingCompleted: true,
    currentTeamId: "team_1",
  },
  {
    id: "user_3",
    email: "bob@example.com",
    fullName: "Bob Johnson",
    avatarUrl: "https://avatar.vercel.sh/bob",
    emailVerified: false,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
    onboardingCompleted: false,
  },
];

// Mock sessions
const mockSessions: MockSession[] = [];

// Current session
let currentSession: MockSession | null = null;

function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store for OTP codes (email -> { code, expiresAt })
const otpStore = new Map<string, { code: string; expiresAt: Date }>();

// Store for reset tokens (email -> { token, expiresAt })
const resetTokenStore = new Map<string, { token: string; expiresAt: Date }>();

export const authAPI = {
  // Authentication methods
  async login(email: string, password: string): Promise<{ user: MockUser; session: MockSession } | null> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.emailVerified) {
      throw new Error("Please verify your email before logging in");
    }

    // For demo purposes, accept any password
    const session: MockSession = {
      id: `session_${Date.now()}`,
      userId: user.id,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    };

    mockSessions.push(session);
    currentSession = session;

    return { user, session };
  },

  async signup(email: string, password: string, fullName: string): Promise<MockUser> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const newUser: MockUser = {
      id: `user_${Date.now()}`,
      email,
      fullName,
      avatarUrl: `https://avatar.vercel.sh/${fullName}`,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      onboardingCompleted: false,
    };

    mockUsers.push(newUser);

    // Generate OTP for email verification
    const otp = generateOTP();
    otpStore.set(email, {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    console.log(`OTP for ${email}: ${otp}`); // In real app, this would be sent via email

    return newUser;
  },

  async verifyEmail(email: string, otp: string): Promise<MockUser> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    
    const otpData = otpStore.get(email);
    if (!otpData) {
      throw new Error("No OTP found for this email");
    }

    if (new Date() > otpData.expiresAt) {
      otpStore.delete(email);
      throw new Error("OTP has expired");
    }

    if (otpData.code !== otp) {
      throw new Error("Invalid OTP");
    }

    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }

    user.emailVerified = true;
    user.updatedAt = new Date();
    otpStore.delete(email);

    return user;
  },

  async resendOTP(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email is already verified");
    }

    const otp = generateOTP();
    otpStore.set(email, {
      code: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    console.log(`New OTP for ${email}: ${otp}`); // In real app, this would be sent via email
  },

  async forgotPassword(email: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      // Don't reveal whether user exists for security
      return;
    }

    const resetToken = generateToken();
    resetTokenStore.set(email, {
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    console.log(`Reset token for ${email}: ${resetToken}`); // In real app, this would be sent via email
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const tokenData = resetTokenStore.get(email);
    if (!tokenData) {
      throw new Error("Invalid or expired reset token");
    }

    if (new Date() > tokenData.expiresAt) {
      resetTokenStore.delete(email);
      throw new Error("Reset token has expired");
    }

    if (tokenData.token !== token) {
      throw new Error("Invalid reset token");
    }

    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }

    // In real app, hash the password
    user.updatedAt = new Date();
    resetTokenStore.delete(email);
  },

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    if (currentSession) {
      const sessionIndex = mockSessions.findIndex(s => s.id === currentSession!.id);
      if (sessionIndex > -1) {
        mockSessions.splice(sessionIndex, 1);
      }
      currentSession = null;
    }
  },

  // Session management
  async getCurrentSession(): Promise<MockSession | null> {
    return currentSession;
  },

  async getCurrentUser(): Promise<MockUser | null> {
    if (!currentSession) return null;
    
    // Check if session is expired
    if (new Date() > currentSession.expiresAt) {
      await this.logout();
      return null;
    }

    return mockUsers.find(u => u.id === currentSession.userId) || null;
  },

  async validateSession(token: string): Promise<MockUser | null> {
    const session = mockSessions.find(s => s.token === token);
    if (!session || new Date() > session.expiresAt) {
      return null;
    }

    return mockUsers.find(u => u.id === session.userId) || null;
  },

  async refreshSession(): Promise<MockSession | null> {
    if (!currentSession) return null;

    currentSession.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Extend by 24 hours
    return currentSession;
  },

  // User management
  async updateUser(userId: string, updates: Partial<MockUser>): Promise<MockUser> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error("User not found");
    }

    Object.assign(user, updates, { updatedAt: new Date() });
    return user;
  },

  async completeOnboarding(userId: string): Promise<MockUser> {
    return this.updateUser(userId, { onboardingCompleted: true });
  },

  // Social auth (mock implementations)
  async loginWithGoogle(): Promise<{ user: MockUser; session: MockSession }> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate OAuth flow
    
    // For demo, create or return existing Google user
    let user = mockUsers.find(u => u.email === "google.user@example.com");
    if (!user) {
      user = {
        id: `user_google_${Date.now()}`,
        email: "google.user@example.com",
        fullName: "Google User",
        avatarUrl: "https://avatar.vercel.sh/google-user",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingCompleted: false,
      };
      mockUsers.push(user);
    }

    const session: MockSession = {
      id: `session_${Date.now()}`,
      userId: user.id,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    mockSessions.push(session);
    currentSession = session;

    return { user, session };
  },

  async loginWithGitHub(): Promise<{ user: MockUser; session: MockSession }> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate OAuth flow
    
    // For demo, create or return existing GitHub user
    let user = mockUsers.find(u => u.email === "github.user@example.com");
    if (!user) {
      user = {
        id: `user_github_${Date.now()}`,
        email: "github.user@example.com",
        fullName: "GitHub User",
        avatarUrl: "https://avatar.vercel.sh/github-user",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        onboardingCompleted: false,
      };
      mockUsers.push(user);
    }

    const session: MockSession = {
      id: `session_${Date.now()}`,
      userId: user.id,
      token: generateToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    mockSessions.push(session);
    currentSession = session;

    return { user, session };
  },

  // Helper methods for development
  getMockUsers: () => mockUsers,
  getMockSessions: () => mockSessions,
  getOTPStore: () => otpStore,
  getResetTokenStore: () => resetTokenStore,
};