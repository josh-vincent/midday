"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { useToast } from "@midday/ui/use-toast";
import { Mail, Loader2, CheckCircle, RefreshCw } from "lucide-react";
import { authAPI } from "@/lib/mock/auth-mock";

function VerifyEmailContent() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    if (!email) {
      toast({
        title: "Error",
        description: "Email address is missing",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await authAPI.verifyEmail(email, otp);
      
      setVerified(true);
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified",
      });
      
      // Redirect to onboarding after a short delay
      setTimeout(() => {
        router.push("/onboarding/welcome");
      }, 2000);
    } catch (error) {
      toast({
        title: "Verification failed",
        description: error instanceof Error ? error.message : "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Email address is missing",
        variant: "destructive",
      });
      return;
    }

    setResending(true);
    
    try {
      await authAPI.resendOTP(email);
      toast({
        title: "Code resent",
        description: "A new verification code has been sent to your email",
      });
    } catch (error) {
      toast({
        title: "Failed to resend",
        description: error instanceof Error ? error.message : "Failed to resend verification code",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const cleanValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(cleanValue);
  };

  if (verified) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-green-600">Email Verified!</h1>
          <p className="text-muted-foreground">
            Your email has been successfully verified. Redirecting you to complete your profile...
          </p>
        </div>

        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Verify your email</h1>
        <p className="text-muted-foreground">
          We've sent a 6-digit verification code to
        </p>
        {email && (
          <p className="font-medium">{email}</p>
        )}
      </div>

      {/* Verification form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="Enter 6-digit code"
            value={otp}
            onChange={(e) => handleOtpChange(e.target.value)}
            className="text-center text-lg tracking-widest"
            maxLength={6}
            autoComplete="one-time-code"
            required
          />
          <p className="text-xs text-muted-foreground text-center">
            Enter the 6-digit code from your email
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || otp.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify email"
          )}
        </Button>
      </form>

      {/* Resend code */}
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?
        </p>
        <Button 
          variant="outline" 
          onClick={handleResendCode}
          disabled={resending}
          className="w-full"
        >
          {resending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resending...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend code
            </>
          )}
        </Button>
      </div>

      {/* Back to login */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Wrong email? </span>
        <Link href="/auth/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </div>

      {/* Demo note */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">Demo Mode:</p>
        <p className="text-xs text-muted-foreground">
          Check the browser console for the verification code
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}