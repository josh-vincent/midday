"use client";

import NumberFlow from "@number-flow/react";

type Props = {
  value: number;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  locale?: string;
};

/**
 * AnimatedNumber - Smoothly animates number changes
 *
 * @example
 * ```tsx
 * <AnimatedNumber value={1234} />
 * <AnimatedNumber value={1234.56} currency="USD" locale="en-US" />
 * ```
 *
 * @param value - The number to display
 * @param currency - Optional currency code (e.g., 'USD', 'EUR')
 * @param minimumFractionDigits - Minimum decimal places
 * @param maximumFractionDigits - Maximum decimal places
 * @param locale - Locale for formatting (defaults to 'en')
 */
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
      format={currency ? {
        style: "currency",
        currency: currency,
        minimumFractionDigits,
        maximumFractionDigits,
      } : undefined}
      willChange
      locales={locale}
    />
  );
}