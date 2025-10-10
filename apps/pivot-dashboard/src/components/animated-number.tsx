"use client";

import { useUserQuery } from "@/hooks/use-user";
import { AnimatedNumber as SharedAnimatedNumber } from "@midday/dashboard-components";

type Props = {
  value: number;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
};

export function AnimatedNumber({
  value,
  currency,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
}: Props) {
  const { data: user } = useUserQuery();
  const localeToUse = locale || user?.locale || "en";

  return (
    <SharedAnimatedNumber
      value={value}
      currency={currency}
      minimumFractionDigits={minimumFractionDigits}
      maximumFractionDigits={maximumFractionDigits}
      locale={localeToUse}
    />
  );
}
