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
import { BarChart } from "./bar-chart";

type Props = {
  disabled?: boolean;
};

export function JobsChart({ disabled }: Props) {
  const trpc = useTRPC();
  const { params } = useReportsParams();

  const { data } = useQuery({
    ...trpc.reports.jobs.queryOptions({
      from: params.from,
      to: params.to,
      currency: params.currency ?? undefined,
    }),
    placeholderData: (previousData) =>
      previousData ?? {
        summary: {
          currency: "USD",
          currentTotal: 0,
          prevTotal: 0,
        },
        meta: {
          type: "count",
          period: "monthly",
          currency: "USD",
        },
        result: [],
      },
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
            currency={null}
            minimumFractionDigits={0}
            maximumFractionDigits={0}
          />
          <span className="text-2xl text-[#606060] ml-2">jobs</span>
        </h1>

        <div className="text-sm text-[#606060] flex items-center space-x-2">
          <p className="text-sm text-[#606060]">
            vs {data?.summary?.prevTotal ?? 0} previous period
          </p>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/jobs"
                  className="flex items-center space-x-1 text-[#606060] hover:text-primary transition-colors"
                >
                  <span className="text-xs">View jobs</span>
                  <Icons.ArrowUpRight className="h-3 w-3" />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="text-xs px-2 py-1">
                <p>View all jobs</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <BarChart data={data} />
    </div>
  );
}
