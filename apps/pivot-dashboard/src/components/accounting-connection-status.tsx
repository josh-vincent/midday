"use client";

import { cn } from "@midday/ui/cn";

type Props = {
  expiresAt?: string;
};

export function AccountingConnectionStatus({ expiresAt }: Props) {
  if (!expiresAt) {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
        <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
        Active
      </span>
    );
  }

  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Expired
  if (daysUntilExpiry < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
        <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400" />
        Expired
      </span>
    );
  }

  // Expiring soon (within 7 days)
  if (daysUntilExpiry <= 7) {
    return (
      <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
        <span className="h-2 w-2 rounded-full bg-yellow-600 dark:bg-yellow-400" />
        Expiring soon
      </span>
    );
  }

  // Active
  return (
    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
      <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
      Active
    </span>
  );
}
