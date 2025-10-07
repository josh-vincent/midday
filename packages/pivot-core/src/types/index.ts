import { z } from 'zod';

/**
 * Pivot-specific types
 *
 * Define your Pivot application types here.
 * These types are separate from Midday to maintain clear boundaries.
 */

export const PivotConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  features: z.array(z.string()).optional(),
});

export type PivotConfig = z.infer<typeof PivotConfigSchema>;

// Add more Pivot-specific types here
export interface PivotEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
