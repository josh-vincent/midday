export { BaseSyncStrategy } from "./base";
export type { ISyncStrategy, SyncPlan } from "./base";
export { UpsertStrategy } from "./upsert";
export { ReplaceStrategy } from "./replace";
export { AppendStrategy } from "./append";
export { IncrementalStrategy } from "./incremental";

import { UpsertStrategy } from "./upsert";
import { ReplaceStrategy } from "./replace";
import { AppendStrategy } from "./append";
import { IncrementalStrategy } from "./incremental";
import type { ISyncStrategy } from "./base";
import type { SyncStrategy } from "../core/types";

/**
 * Strategy registry
 */
export const STRATEGY_REGISTRY: Record<SyncStrategy, ISyncStrategy> = {
  upsert: new UpsertStrategy(),
  replace: new ReplaceStrategy(),
  append: new AppendStrategy(),
  incremental: new IncrementalStrategy(),
};

/**
 * Get strategy by name
 */
export function getStrategy(name: SyncStrategy): ISyncStrategy {
  const strategy = STRATEGY_REGISTRY[name];
  if (!strategy) {
    throw new Error(`Unknown sync strategy: ${name}`);
  }
  return strategy;
}
