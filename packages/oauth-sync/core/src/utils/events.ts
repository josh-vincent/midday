/**
 * Event system for OAuth Sync
 * Provides Stripe-like event handling for token lifecycle
 */

import type { OAuthProvider } from "../core/types";

export type OAuthEventMap = {
  'token.refreshed': TokenRefreshedEvent;
  'token.expired': TokenExpiredEvent;
  'token.refresh.failed': TokenRefreshFailedEvent;
  'connection.created': ConnectionCreatedEvent;
  'connection.removed': ConnectionRemovedEvent;
  'error': ErrorEvent;
};

export interface TokenRefreshedEvent {
  provider: OAuthProvider;
  connectionId: string;
  orgId?: string;
  teamId?: string;
  userId: string;
  expiresAt: string;
  refreshedAt: string;
}

export interface TokenExpiredEvent {
  provider: OAuthProvider;
  connectionId: string;
  orgId?: string;
  teamId?: string;
  userId: string;
  expiredAt: string;
}

export interface TokenRefreshFailedEvent {
  provider: OAuthProvider;
  connectionId: string;
  error: string;
  orgId?: string;
  teamId?: string;
  userId: string;
}

export interface ConnectionCreatedEvent {
  provider: OAuthProvider;
  connectionId: string;
  orgId?: string;
  teamId?: string;
  userId: string;
  createdAt: string;
}

export interface ConnectionRemovedEvent {
  connectionId: string;
  provider: OAuthProvider;
  orgId?: string;
  teamId?: string;
  userId: string;
  removedAt: string;
}

export interface ErrorEvent {
  message: string;
  code?: string;
  provider?: OAuthProvider;
  connectionId?: string;
  stack?: string;
}

type EventHandler<T> = (event: T) => void | Promise<void>;

/**
 * Simple event emitter for OAuth events
 * Stripe-style event handling
 */
export class OAuthEventEmitter {
  private listeners: Map<keyof OAuthEventMap, Set<EventHandler<any>>> = new Map();

  /**
   * Subscribe to an event
   *
   * @example
   * ```typescript
   * oauth.on('token.refreshed', (event) => {
   *   console.log('Token refreshed:', event.provider);
   * });
   * ```
   */
  on<K extends keyof OAuthEventMap>(
    event: K,
    handler: EventHandler<OAuthEventMap[K]>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof OAuthEventMap>(
    event: K,
    handler: EventHandler<OAuthEventMap[K]>
  ): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first call)
   */
  once<K extends keyof OAuthEventMap>(
    event: K,
    handler: EventHandler<OAuthEventMap[K]>
  ): void {
    const onceHandler = async (data: OAuthEventMap[K]) => {
      await handler(data);
      this.off(event, onceHandler as any);
    };
    this.on(event, onceHandler as any);
  }

  /**
   * Emit an event to all subscribed handlers
   */
  async emit<K extends keyof OAuthEventMap>(
    event: K,
    data: OAuthEventMap[K]
  ): Promise<void> {
    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) return;

    // Execute all handlers (async)
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(data);
      } catch (error) {
        // Emit error event if handler fails
        if (event !== 'error') {
          const errorEvent: ErrorEvent = {
            message: error instanceof Error ? error.message : String(error),
            code: 'EVENT_HANDLER_ERROR',
            stack: error instanceof Error ? error.stack : undefined,
          };
          // Emit error event (but don't await to prevent infinite loop)
          this.emit('error', errorEvent).catch(console.error);
        } else {
          // If error handler itself fails, log to console
          console.error('Error in error event handler:', error);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Remove all listeners for a specific event or all events
   */
  removeAllListeners(event?: keyof OAuthEventMap): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event
   */
  listenerCount(event: keyof OAuthEventMap): number {
    return this.listeners.get(event)?.size || 0;
  }

  /**
   * Get all event names with active listeners
   */
  eventNames(): (keyof OAuthEventMap)[] {
    return Array.from(this.listeners.keys()).filter(
      (event) => this.listeners.get(event)!.size > 0
    );
  }
}

/**
 * Helper to create typed event emitter
 */
export function createEventEmitter(): OAuthEventEmitter {
  return new OAuthEventEmitter();
}
