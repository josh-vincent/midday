"use client";

import { useReportsParams } from "@/hooks/use-reports-params-client";
import { useTRPC } from "@/trpc/client";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AnimatedNumber } from "../animated-number";
import { FormatAmount } from "../format-amount";
import { BarChart } from "./bar-chart";
import { chartExampleData } from "./data";

type Props = {
  disabled?: boolean;
};

export function InvoiceChart({ disabled }: Props) {
  const trpc = useTRPC();
  const { params } = useReportsParams();

  const { data } = useQuery({
    ...trpc.reports.invoice.queryOptions({
      startDate: params.from,
      endDate: params.to,
      currency: params.currency ?? undefined,
    }),
    placeholderData: (previousData) => previousData ?? chartExampleData,
  });

  return (
    <div
      className={cn(
        disabled && "pointer-events-none select-none blur-[8px] opacity-20",
      )}
    >
      <div className="space-y-2 mb-14 inline-block select-text">
        <h1 className="text-4xl font-mono">
          <AnimatedNumber
            value={data?.summary?.currentTotal ?? 0}
            currency={data?.summary?.currency ?? "USD"}
          />
        </h1>

        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <p className="text-sm text-[#606060]">
            vs{" "}
            <FormatAmount
              amount={data?.summary?.prevTotal ?? 0}
              currency={data?.summary?.currency ?? "USD"}
            />
          </p>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/invoices"
                  className="flex items-center space-x-1 text-[#606060] hover:text-primary transition-colors"
                >
                  <span className="text-xs">View invoices</span>
                  <Icons.Overview className="h-3 w-3" />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="text-xs px-2 py-1">
                <p>View all invoices</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <BarChart data={data} />
    </div>
  );
}
