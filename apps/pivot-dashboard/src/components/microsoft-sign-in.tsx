"use client";

import { createClient } from "@midday/supabase/client";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function MicrosoftSignIn() {
  const [isLoading, setLoading] = useState(false);
  const supabase = createClient();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("return_to");

  const handleSignIn = async () => {
    setLoading(true);

    const redirectTo = new URL("/api/auth/callback", window.location.origin);

    if (returnTo) {
      redirectTo.searchParams.append("return_to", returnTo);
    }

    redirectTo.searchParams.append("provider", "azure");

    await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo: redirectTo.toString(),
        scopes: "openid email profile offline_access",
      },
    });
  };

  return (
    <Button
      onClick={handleSignIn}
      variant="outline"
      className="w-full h-12"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Icons.Microsoft className="mr-2" />
          <span>Continue with Microsoft</span>
        </>
      )}
    </Button>
  );
}
