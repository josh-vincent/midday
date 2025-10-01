"use client";

import { Shield } from "lucide-react";
import { SecurityForm } from "@/components/settings/security-form";

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Security</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your password, two-factor authentication, and security preferences.
        </p>
      </div>

      {/* Security Form */}
      <SecurityForm />
    </div>
  );
}