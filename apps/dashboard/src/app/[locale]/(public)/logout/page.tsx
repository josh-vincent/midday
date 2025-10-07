"use client";

import { createClient } from "@midday/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LogoutPage() {
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Sign out with local scope to clear all session data
        await supabase.auth.signOut({
          scope: "local",
        });

        // Redirect to login page after successful logout
        router.push("/login");
      } catch (error) {
        console.error("Logout error:", error);
        // Still redirect to login even if there's an error
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    handleLogout();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">
          {isLoading ? "Signing out..." : "Signed out"}
        </h1>
        <p className="text-muted-foreground">
          {isLoading
            ? "Please wait while we sign you out"
            : "Redirecting to login..."}
        </p>
      </div>
    </div>
  );
}
