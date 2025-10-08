"use client";

import { Button } from "@midday/ui/button";
import { useState } from "react";
import { useToast } from "@midday/ui/use-toast";

export function ConnectXero() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      // Get OAuth authorization URL from API
      const response = await fetch("/api/accounting/xero/authorize", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to get authorization URL");
      }

      const { authUrl } = await response.json();

      // Redirect to Xero OAuth page
      window.location.href = authUrl;
    } catch (error) {
      console.error("Xero connection error:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Xero. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
          <span className="font-semibold text-lg text-blue-600 dark:text-blue-400">
            X
          </span>
        </div>
        <div>
          <p className="font-medium">Xero</p>
          <p className="text-sm text-muted-foreground">
            Sync invoices and transactions
          </p>
        </div>
      </div>
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        variant="outline"
        size="sm"
      >
        {isConnecting ? "Connecting..." : "Connect"}
      </Button>
    </div>
  );
}
