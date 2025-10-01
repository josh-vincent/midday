"use client";

import NumberFlow from "@number-flow/react";

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
  locale = "en",
}: Props) {
  return (
    <NumberFlow
      value={value}
      format={ currency ? {
        style: "currency",
        currency: currency ?? "AUD",
        minimumFractionDigits,
        maximumFractionDigits,
      } : undefined}
      willChange
      locales={locale}
    />
  );
}
