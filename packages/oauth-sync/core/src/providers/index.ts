export { BaseOAuthProvider } from "./base";
export type { IOAuthProvider, TokenExchangeResponse } from "./base";
export { QuickBooksProvider } from "./quickbooks";
export { XeroProvider } from "./xero";
export { OutlookProvider } from "./outlook";
export { GoogleProvider } from "./google";
export { CustomProvider, createCustomProvider } from "./custom";

import { QuickBooksProvider } from "./quickbooks";
import { XeroProvider } from "./xero";
import { OutlookProvider } from "./outlook";
import { GoogleProvider } from "./google";
import type { IOAuthProvider } from "./base";
import type { OAuthProvider } from "../core/types";

/**
 * Provider registry - maps provider names to their implementations
 */
export const PROVIDER_REGISTRY: Record<OAuthProvider, () => IOAuthProvider> = {
  quickbooks: () => new QuickBooksProvider(),
  xero: () => new XeroProvider(),
  gmail: () => new GoogleProvider(),
  outlook: () => new OutlookProvider(),
};

/**
 * Get a provider instance by name
 */
export function getProvider(provider: OAuthProvider): IOAuthProvider {
  const factory = PROVIDER_REGISTRY[provider];
  if (!factory) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return factory();
}
