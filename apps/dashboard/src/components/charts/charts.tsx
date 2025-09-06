"use client";

import { useReportsParams } from "@/hooks/use-reports-params-client";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { BurnRateChart } from "./burn-rate-chart";
import { ExpenseChart } from "./expense-chart";
import { InvoiceChart } from "./invoice-chart";
import { JobsChart } from "./jobs-chart";
import { ProfitChart } from "./profit-chart";
import { RevenueChart } from "./revenue-chart";
import { VolumeChart } from "./volume-chart";

export function Charts() {
  const { params } = useReportsParams();
  const trpc = useTRPC();

  const { data: accounts } = useQuery(
    trpc.bankAccounts.get.queryOptions({
      enabled: true,
    }),
  );

  // If the user has not connected any accounts, disable the charts
  const disabled = !accounts?.length;

  switch (params.chart) {
    case "revenue":
      return <RevenueChart disabled={disabled} />;
    case "profit":
      return <ProfitChart disabled={disabled} />;
    case "burn_rate":
      return <BurnRateChart disabled={disabled} />;
    case "expense":
      return <ExpenseChart disabled={disabled} />;
    case "invoice":
      return <InvoiceChart disabled={disabled} />;
    case "jobs":
      return <JobsChart disabled={disabled} />;
    case "volume":
      return <VolumeChart disabled={disabled} />;
    default:
      return null;
  }
}
