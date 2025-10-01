export function formatAmount({
  amount,
  currency,
  locale = 'en-US'
}: {
  amount: number;
  currency: string;
  locale?: string;
}) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}