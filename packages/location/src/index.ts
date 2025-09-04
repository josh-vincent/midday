// Stub implementation for location utilities

export function getCountryCode(): string {
  return "AU";
}

export function getCurrency(): string {
  return "AUD";
}

export function getLocale(): string {
  return "en-AU";
}

export function getTimezone(): string {
  return "Australia/Sydney";
}

export function isEU(): boolean {
  return false;
}

export const uniqueCurrencies = [
  { code: "AUD", name: "Australian Dollar", symbol: "$" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "$" },
];