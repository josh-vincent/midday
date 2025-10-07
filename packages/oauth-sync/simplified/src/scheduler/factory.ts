import type { IScheduler, SchedulerConfig } from './interface';
import { NodeScheduler } from './node';
import { VercelScheduler } from './vercel';
import { CloudflareScheduler } from './cloudflare';
import { AWSScheduler } from './aws';
import { DenoScheduler } from './deno';

/**
 * Auto-detect platform and create appropriate scheduler
 */
export function createScheduler(config: SchedulerConfig = {}): IScheduler {
  // If platform explicitly specified, use that
  if (config.platform && config.platform !== 'auto') {
    return createSchedulerForPlatform(config.platform, config);
  }

  // Auto-detect platform based on environment
  const platform = detectPlatform();
  return createSchedulerForPlatform(platform, config);
}

/**
 * Create scheduler for specific platform
 */
function createSchedulerForPlatform(
  platform: 'node' | 'vercel' | 'cloudflare' | 'aws' | 'deno',
  config: SchedulerConfig
): IScheduler {
  switch (platform) {
    case 'vercel':
      return new VercelScheduler(config);
    case 'cloudflare':
      return new CloudflareScheduler(config);
    case 'aws':
      return new AWSScheduler(config);
    case 'deno':
      return new DenoScheduler(config);
    case 'node':
    default:
      return new NodeScheduler(config);
  }
}

/**
 * Detect current runtime platform
 */
function detectPlatform(): 'node' | 'vercel' | 'cloudflare' | 'aws' | 'deno' {
  // Check for Deno
  // @ts-expect-error - Deno is a global in Deno runtime
  if (typeof Deno !== 'undefined') {
    return 'deno';
  }

  // Check for Cloudflare Workers
  if (typeof globalThis !== 'undefined' && 'caches' in globalThis && 'WebSocketPair' in globalThis) {
    return 'cloudflare';
  }

  // Check environment variables
  if (process?.env) {
    // Vercel
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
      return 'vercel';
    }

    // AWS Lambda
    if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV) {
      return 'aws';
    }
  }

  // Default to Node.js
  return 'node';
}

/**
 * Get platform name for logging
 */
export function getPlatformName(): string {
  const platform = detectPlatform();
  const names = {
    node: 'Node.js',
    vercel: 'Vercel',
    cloudflare: 'Cloudflare Workers',
    aws: 'AWS Lambda',
    deno: 'Deno',
  };
  return names[platform];
}

/**
 * Check if current platform supports native scheduling
 */
export function supportsNativeScheduling(): boolean {
  const platform = detectPlatform();
  // Only Node.js supports native setInterval-based scheduling
  return platform === 'node';
}
