"use client";

import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import backgroundDark from "public/assets/bg-login-dark.jpg";
import backgroundLight from "public/assets/bg-login.jpg";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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

  return (
    <div className="h-screen p-2">
      {/* Header - Logo */}
      <header className="absolute top-0 left-0 z-30 w-full">
        <div className="p-6 md:p-8">
          <Link href="/login">
            <Icons.LogoSmall className="h-8 w-auto" />
          </Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-full">
        {/* Background Image Section - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <Image
            src={backgroundLight}
            alt="Background"
            className="object-cover dark:hidden"
            priority
            fill
          />
          <Image
            src={backgroundDark}
            alt="Background"
            className="object-cover hidden dark:block"
            priority
            fill
          />
        </div>

        {/* Form Section */}
        <div className="w-full lg:w-1/2 relative">
          <div className="relative z-10 flex h-full items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
              {/* Header */}
              <div className="text-center">
                <h1 className="text-2xl mb-4 font-serif">
                  Reset Your Password
                </h1>
                <p className="text-[#878787] text-sm mb-8">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
              </div>

              {/* Form */}
              <div className="space-y-4">
                {success ? (
                  <div className="text-center space-y-4">
                    <div className="text-green-600 dark:text-green-400">
                      <Icons.Check className="h-12 w-12 mx-auto mb-4" />
                      <p className="font-medium">Check your email!</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      We've sent a password reset link to {email}
                    </p>
                    <Link href="/login">
                      <Button variant="outline" className="w-full">
                        Back to login
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12"
                    />

                    {error && (
                      <div className="text-sm text-red-500 text-center">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12"
                      disabled={isLoading || !email}
                    >
                      {isLoading ? (
                        <>
                          <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
                          Sending reset link...
                        </>
                      ) : (
                        "Send reset link"
                      )}
                    </Button>

                    <div className="text-center">
                      <Link
                        href="/login"
                        className="text-sm text-[#878787] hover:text-primary underline"
                      >
                        Back to login
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
