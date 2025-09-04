"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Icons } from "@midday/ui/icons";
import { cn } from "@midday/ui/cn";

type Props = {
  className?: string;
};

export function PasswordSignUp({ className }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className={cn("text-center space-y-4", className)}>
        <div className="text-green-600 dark:text-green-400">
          <Icons.Check className="h-12 w-12 mx-auto mb-4" />
          <p className="font-medium">Account created successfully!</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Please check your email to verify your account.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-12"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-12"
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-12"
          />
        </div>
        
        {error && (
          <div className="text-sm text-red-500 text-center">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12"
          disabled={isLoading || !email || !password || !confirmPassword}
        >
          {isLoading ? (
            <>
              <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </div>
  );
}