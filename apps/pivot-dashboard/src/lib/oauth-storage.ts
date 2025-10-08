/**
 * LocalStorage-based OAuth token storage
 * WARNING: This is for development/testing only. Use database storage in production!
 */

export type OAuthProvider = "quickbooks" | "xero";

export interface OAuthConnection {
  id: string;
  provider: OAuthProvider;
  teamId: string;
  userId: string;
  credentials: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: string;
    connectedAt: string;
    scope?: string;
    tokenType?: string;
  };
  tenantId?: string;
  tenantName?: string;
  expiresAt: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "oauth_connections";

/**
 * Get all OAuth connections from localStorage
 */
export async function getOAuthConnections(teamId?: string): Promise<OAuthConnection[]> {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const connections: OAuthConnection[] = JSON.parse(stored);

    if (teamId) {
      return connections.filter((c) => c.teamId === teamId);
    }

    return connections;
  } catch (error) {
    console.error("Error reading OAuth connections from localStorage:", error);
    return [];
  }
}

/**
 * Get a specific OAuth connection by ID
 */
export async function getOAuthConnection(id: string): Promise<OAuthConnection | null> {
  const connections = await getOAuthConnections();
  return connections.find((c) => c.id === id) || null;
}

/**
 * Get OAuth connections by provider
 */
export async function getOAuthConnectionsByProvider(
  provider: OAuthProvider,
  teamId?: string
): Promise<OAuthConnection[]> {
  const connections = await getOAuthConnections(teamId);
  return connections.filter((c) => c.provider === provider);
}

/**
 * Save a new OAuth connection
 */
export async function saveOAuthConnection(
  connection: Omit<OAuthConnection, "id" | "createdAt" | "updatedAt">
): Promise<OAuthConnection> {
  if (typeof window === "undefined") {
    throw new Error("localStorage is not available");
  }

  const newConnection: OAuthConnection = {
    ...connection,
    id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const connections = await getOAuthConnections();
  connections.push(newConnection);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));

  return newConnection;
}

/**
 * Update an existing OAuth connection tokens
 */
export async function updateOAuthConnection(
  id: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: string;
  }
): Promise<void> {
  if (typeof window === "undefined") return;

  const connections = await getOAuthConnections();
  const index = connections.findIndex((c) => c.id === id);

  if (index !== -1) {
    connections[index].credentials = {
      ...connections[index].credentials,
      ...tokens,
    };
    connections[index].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
  }
}

/**
 * Delete an OAuth connection
 */
export async function deleteOAuthConnection(id: string): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const connections = await getOAuthConnections();
    const filtered = connections.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting connection:", error);
    return false;
  }
}

/**
 * Clear all OAuth connections (useful for testing)
 */
export async function clearAllOAuthConnections(): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if a provider is already connected
 */
export async function isProviderConnected(
  provider: OAuthProvider,
  teamId?: string
): Promise<boolean> {
  const connections = await getOAuthConnectionsByProvider(provider, teamId);
  return connections.length > 0;
}
