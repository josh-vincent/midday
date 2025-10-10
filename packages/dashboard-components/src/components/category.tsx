"use client";

import { cn } from "@midday/ui/cn";

type CategoryIconProps = {
  color?: string;
  size?: number;
  className?: string;
};

/**
 * CategoryColor - Display a colored indicator for categories
 *
 * @example
 * ```tsx
 * <CategoryColor color="#FF5733" size={16} />
 * ```
 */
export function CategoryColor({
  color,
  className,
  size = 12,
}: CategoryIconProps) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: color,
        width: size,
        height: size,
      }}
    />
  );
}

type Props = {
  name: string;
  className?: string;
  color?: string;
};

/**
 * Category - Display a category with color indicator and name
 *
 * @example
 * ```tsx
 * <Category name="Travel" color="#4CAF50" />
 * ```
 *
 * @param name - Category name
 * @param color - Color for the category indicator
 * @param className - Additional CSS classes
 */
export function Category({ name, color, className }: Props) {
  return (
    <div className={cn("flex space-x-2 items-center", className)}>
      <CategoryColor color={color} />
      {name && <span>{name}</span>}
    </div>
  );
}