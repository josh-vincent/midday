import type { App } from "./types";

export const apps: App[] = [
  {
    id: "quickbooks",
    name: "QuickBooks",
    active: true,
    logo: "https://logo.clearbit.com/intuit.com",
    short_description: "Connect your QuickBooks account to sync customers and invoices",
    description: "QuickBooks integration allows you to automatically sync your customers, invoices, and accounting data between Midday and QuickBooks Online. Keep your financial data up-to-date across both platforms with automatic OAuth token refresh.",
    category: "Accounting",
    images: [],
    onInitialize: () => {
      // Get team ID from context or user session
      const teamId = globalThis.localStorage?.getItem("teamId") || "default";
      const baseUrl = typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3336";

      // Redirect to OAuth authorization
      window.location.href = `${baseUrl}/api/oauth/quickbooks/authorize?teamId=${encodeURIComponent(teamId)}`;
    },
  },
  {
    id: "xero",
    name: "Xero",
    active: true,
    logo: "https://logo.clearbit.com/xero.com",
    short_description: "Connect your Xero account to sync customers and invoices",
    description: "Xero integration enables automatic synchronization of your customers, invoices, and accounting data between Midday and Xero. Your OAuth tokens are automatically refreshed to maintain a seamless connection.",
    category: "Accounting",
    images: [],
    onInitialize: () => {
      // Get team ID from context or user session
      const teamId = globalThis.localStorage?.getItem("teamId") || "default";
      const baseUrl = typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3336";

      // Redirect to OAuth authorization
      window.location.href = `${baseUrl}/api/oauth/xero/authorize?teamId=${encodeURIComponent(teamId)}`;
    },
  },
];

export default apps;
