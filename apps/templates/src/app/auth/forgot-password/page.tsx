"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { useToast } from "@midday/ui/use-toast";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { authAPI } from "@/lib/mock/auth-mock";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for password reset instructions",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We've sent password reset instructions to
          </p>
          <p className="font-medium">{email}</p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you don't see the email, check your spam folder or try again with a different email address.
          </p>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="w-full"
          >
            Try different email
          </Button>
        </div>

        <div className="text-center text-sm">
          <Link 
            href="/auth/login" 
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        {/* Demo note */}
        <div className="mt-6 p-4 bg-muted rounded-lg text-left">
          <p className="text-sm font-medium mb-2">Demo Mode:</p>
          <p className="text-xs text-muted-foreground">
            Check the browser console for the reset token
          </p>
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
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </div>

      {/* Reset form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>

      {/* Back to login */}
      <div className="text-center text-sm">
        <Link 
          href="/auth/login" 
          className="text-primary hover:underline inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </div>
  );
}