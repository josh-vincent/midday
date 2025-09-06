"use client";

import { ConsentBanner } from "@/components/consent-banner";
import { PasswordSignIn } from "@/components/password-sign-in";
import { PasswordSignUp } from "@/components/password-sign-up";
import { Cookies } from "@/utils/constants";
import { isEU } from "@midday/location";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import Image from "next/image";
import Link from "next/link";
import backgroundDark from "public/assets/bg-login-dark.jpg";
import backgroundLight from "public/assets/bg-login.jpg";
import { useState } from "react";

export default function Page() {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="h-screen p-2">
      {/* Header - Logo */}
      <header className="absolute top-0 left-0 z-30 w-full">
        <div className="p-6 md:p-8">
          <Icons.LogoSmall className="h-8 w-auto" />
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

        {/* Login Form Section */}
        <div className="w-full lg:w-1/2 relative">
          {/* Form Content */}
          <div className="relative z-10 flex h-full items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
              {/* Welcome Section */}
              <div className="text-center">
                <h1 className="text-2xl mb-4 font-serif">
                  {isSignUp ? "Create Your Account" : "Welcome Back"}
                </h1>
                <p className="text-[#878787] text-sm mb-8">
                  {isSignUp
                    ? "Sign up to start managing your invoices"
                    : "Sign in to your account to continue"}
                </p>
              </div>

              {/* Sign In/Up Form */}
              <div className="space-y-4">
                {isSignUp ? <PasswordSignUp /> : <PasswordSignIn />}

                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-[#878787] hover:text-primary"
                  >
                    {isSignUp
                      ? "Already have an account? Sign in"
                      : "Don't have an account? Sign up"}
                  </Button>
                </div>

                <div className="text-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#878787] hover:text-primary underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {/* Terms and Privacy */}
              <div className="text-center absolute bottom-4 left-0 right-0">
                <p className="text-xs text-[#878787] leading-relaxed font-mono">
                  By signing in you agree to our{" "}
                  <Link href="https://midday.ai/terms" className="underline">
                    Terms of service
                  </Link>{" "}
                  &{" "}
                  <Link href="https://midday.ai/policy" className="underline">
                    Privacy policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
