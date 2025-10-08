"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@midday/ui/skeleton";
import type { TransactionType } from "./data";
import { TransactionsItemList } from "./transactions-item-list";

type Props = {
  type: TransactionType;
  disabled: boolean;
};

export function TransactionsList({ type, disabled }: Props) {
  const trpc = useTRPC();

  // Use regular useQuery instead of useSuspenseQuery for better error handling
  const {
    data: transactions,
    isLoading,
    isError,
  } = useQuery({
    ...trpc.transactions.get.queryOptions({
      pageSize: 15,
      type: type === "all" ? undefined : type,
    }),
    retry: 1, // Only retry once if it fails
    retryDelay: 1000, // Wait 1 second before retry
    enabled: !disabled, // Don't fetch if disabled
  });

  // Handle loading state
  if (isLoading || disabled) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`skeleton-${i}`} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Handle error state gracefully
  if (isError) {
    return (
      <div className="flex items-center justify-center aspect-square">
        <p className="text-sm text-muted-foreground -mt-12">
          Unable to load transactions
        </p>
      </div>
    );
  }

  // Handle empty state
  if (!transactions?.data?.length) {
    return (
      <div className="flex items-center justify-center aspect-square">
        <p className="text-sm text-[#606060] -mt-12">No transactions found</p>
      </div>
    );
  }

  return (
    <TransactionsItemList
      transactions={transactions.data}
      disabled={disabled}
    />
  );
}
