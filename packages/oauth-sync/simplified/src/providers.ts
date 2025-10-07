/**
 * Provider Configuration Presets
 *
 * Auto-configure OAuth providers with Zod validation and environment variable support.
 */

import { z } from "zod";

// ============================================================================
// Provider Config Schemas
// ============================================================================

/**
 * Base OAuth provider config schema
 */
export const BaseProviderConfigSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client secret is required"),
  environment: z.enum(["production", "sandbox"]).optional().default("production"),
});

/**
 * Environment variable config - just pass the prefix!
 */
export const EnvProviderConfigSchema = z.string().transform((prefix) => ({
  clientId: process.env[`${prefix}_CLIENT_ID`] || "",
  clientSecret: process.env[`${prefix}_CLIENT_SECRET`] || "",
  environment: (process.env[`${prefix}_ENVIRONMENT`] as "production" | "sandbox") || "production",
}));

/**
 * Flexible provider config - accepts object or env prefix string
 */
export const FlexibleProviderConfigSchema = z.union([
  BaseProviderConfigSchema,
  EnvProviderConfigSchema,
]);

// ============================================================================
// Provider Presets
// ============================================================================

/**
 * Xero provider preset
 *
 * @example
 * ```typescript
 * // From env variables
 * providers: { xero: xero('XERO') }
 *
 * // Or explicit
 * providers: { xero: xero({ clientId: '...', clientSecret: '...' }) }
 * ```
 */
export function xero(config?: string | { clientId: string; clientSecret: string; environment?: "production" | "sandbox" }) {
  if (!config) {
    // Auto-load from default env vars
    return FlexibleProviderConfigSchema.parse("XERO");
  }

  return FlexibleProviderConfigSchema.parse(config);
}

/**
 * QuickBooks provider preset
 *
 * @example
 * ```typescript
 * // From env variables
 * providers: { quickbooks: quickbooks('QB') }
 *
 * // Or explicit
 * providers: { quickbooks: quickbooks({ clientId: '...', clientSecret: '...' }) }
 * ```
 */
export function quickbooks(config?: string | { clientId: string; clientSecret: string; environment?: "production" | "sandbox" }) {
  if (!config) {
    // Auto-load from default env vars
    return FlexibleProviderConfigSchema.parse("QUICKBOOKS");
  }

  return FlexibleProviderConfigSchema.parse(config);
}

/**
 * Outlook provider preset
 *
 * @example
 * ```typescript
 * // From env variables
 * providers: { outlook: outlook('OUTLOOK') }
 *
 * // Or explicit
 * providers: { outlook: outlook({ clientId: '...', clientSecret: '...' }) }
 * ```
 */
export function outlook(config?: string | { clientId: string; clientSecret: string; environment?: "production" | "sandbox" }) {
  if (!config) {
    return FlexibleProviderConfigSchema.parse("OUTLOOK");
  }

  return FlexibleProviderConfigSchema.parse(config);
}

/**
 * Gmail provider preset
 *
 * @example
 * ```typescript
 * // From env variables
 * providers: { gmail: gmail('GMAIL') }
 *
 * // Or explicit
 * providers: { gmail: gmail({ clientId: '...', clientSecret: '...' }) }
 * ```
 */
export function gmail(config?: string | { clientId: string; clientSecret: string; environment?: "production" | "sandbox" }) {
  if (!config) {
    return FlexibleProviderConfigSchema.parse("GMAIL");
  }

  return FlexibleProviderConfigSchema.parse(config);
}

// ============================================================================
// Auto-Provider Detection
// ============================================================================

/**
 * Auto-detect and configure all providers from environment variables
 *
 * @example
 * ```typescript
 * // Just list the providers you want
 * const oauth = createOAuthSync({
 *   providers: autoProviders(['xero', 'quickbooks']),
 *   storage: 'supabase',
 * });
 * ```
 */
export function autoProviders(providerNames: Array<"xero" | "quickbooks" | "outlook" | "gmail">) {
  const providers: Record<string, any> = {};

  const presets = {
    xero: () => xero(),
    quickbooks: () => quickbooks(),
    outlook: () => outlook(),
    gmail: () => gmail(),
  };

  for (const name of providerNames) {
    providers[name] = presets[name]();
  }

  return providers;
}

/**
 * Auto-detect ALL available providers from environment variables
 *
 * Looks for: XERO_CLIENT_ID, QUICKBOOKS_CLIENT_ID, OUTLOOK_CLIENT_ID, GMAIL_CLIENT_ID
 *
 * @example
 * ```typescript
 * // Auto-detect everything!
 * const oauth = createOAuthSync({
 *   providers: detectProviders(),
 *   storage: 'supabase',
 * });
 * ```
 */
export function detectProviders() {
  const providers: Record<string, any> = {};

  // Check for Xero
  if (process.env.XERO_CLIENT_ID) {
    providers.xero = xero();
  }

  // Check for QuickBooks
  if (process.env.QUICKBOOKS_CLIENT_ID || process.env.QB_CLIENT_ID) {
    providers.quickbooks = quickbooks(process.env.QUICKBOOKS_CLIENT_ID ? "QUICKBOOKS" : "QB");
  }

  // Check for Outlook
  if (process.env.OUTLOOK_CLIENT_ID) {
    providers.outlook = outlook();
  }

  // Check for Gmail
  if (process.env.GMAIL_CLIENT_ID) {
    providers.gmail = gmail();
  }

  return providers;
}

// ============================================================================
// Provider Group Presets
// ============================================================================

/**
 * Accounting providers preset (Xero + QuickBooks)
 *
 * @example
 * ```typescript
 * const oauth = createOAuthSync({
 *   providers: accountingProviders(),
 *   storage: 'supabase',
 * });
 * ```
 */
export function accountingProviders() {
  return autoProviders(["xero", "quickbooks"]);
}

/**
 * Email providers preset (Outlook + Gmail)
 *
 * @example
 * ```typescript
 * const oauth = createOAuthSync({
 *   providers: emailProviders(),
 *   storage: 'supabase',
 * });
 * ```
 */
export function emailProviders() {
  return autoProviders(["outlook", "gmail"]);
}

/**
 * All providers preset
 *
 * @example
 * ```typescript
 * const oauth = createOAuthSync({
 *   providers: allProviders(),
 *   storage: 'supabase',
 * });
 * ```
 */
export function allProviders() {
  return autoProviders(["xero", "quickbooks", "outlook", "gmail"]);
}

// ============================================================================
// Custom Provider Builder
// ============================================================================

/**
 * Create a custom provider configuration
 *
 * @example
 * ```typescript
 * providers: {
 *   myapi: customProvider({
 *     clientId: process.env.MYAPI_CLIENT_ID!,
 *     clientSecret: process.env.MYAPI_CLIENT_SECRET!,
 *     environment: 'production',
 *   }),
 * }
 * ```
 */
export function customProvider(config: {
  clientId: string;
  clientSecret: string;
  environment?: "production" | "sandbox";
}) {
  return BaseProviderConfigSchema.parse(config);
}

/**
 * Create provider from environment variable prefix
 *
 * @example
 * ```typescript
 * providers: {
 *   salesforce: fromEnv('SALESFORCE'),
 * }
 *
 * // Uses: SALESFORCE_CLIENT_ID, SALESFORCE_CLIENT_SECRET, SALESFORCE_ENVIRONMENT
 * ```
 */
export function fromEnv(prefix: string) {
  return FlexibleProviderConfigSchema.parse(prefix);
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate all provider configs
 */
export function validateProviders(providers: Record<string, any>) {
  const validated: Record<string, any> = {};

  for (const [name, config] of Object.entries(providers)) {
    try {
      validated[name] = BaseProviderConfigSchema.parse(config);
    } catch (error) {
      throw new Error(`Invalid configuration for provider "${name}": ${error}`);
    }
  }

  return validated;
}

/**
 * Check if provider is configured
 */
export function isProviderConfigured(provider: string): boolean {
  const prefix = provider.toUpperCase();
  return !!(
    process.env[`${prefix}_CLIENT_ID`] ||
    process.env[`${prefix.slice(0, 2)}_CLIENT_ID`] // Try short form (QB for QuickBooks)
  );
}

/**
 * Get available providers from environment
 */
export function getAvailableProviders(): string[] {
  const available: string[] = [];

  if (isProviderConfigured("xero")) available.push("xero");
  if (isProviderConfigured("quickbooks")) available.push("quickbooks");
  if (isProviderConfigured("outlook")) available.push("outlook");
  if (isProviderConfigured("gmail")) available.push("gmail");

  return available;
}
