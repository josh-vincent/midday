"use client";

import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import type { ReactNode } from "react";

/**
 * Get initials from a name (first two characters)
 */
function getInitials(value: string): string {
  const formatted = value.toUpperCase().replace(/[\s.-]/g, "");

  if (formatted.split(" ").length > 1) {
    return `${formatted.charAt(0)}${formatted.charAt(1)}`;
  }

  if (value.length > 1) {
    return formatted.charAt(0) + formatted.charAt(1);
  }

  return formatted.charAt(0);
}

export interface AvatarCellProps {
  /**
   * Primary display name
   */
  name: string;

  /**
   * Optional logo/image URL for the avatar
   */
  logoUrl?: string | null;

  /**
   * Avatar size (defaults to Tailwind size-5 for invoices)
   */
  avatarSize?: "sm" | "md" | "lg";

  /**
   * Additional details to show in mobile tooltip
   */
  tooltipDetails?: Array<{
    label?: string;
    value: string;
  }>;

  /**
   * Optional action icon/element to show after the name (e.g., warning icon, view icon)
   */
  actionElement?: ReactNode;

  /**
   * Custom avatar class name
   */
  avatarClassName?: string;

  /**
   * Container class name
   */
  className?: string;
}

/**
 * Shared avatar cell component for tables
 * Displays avatar with initials, name (hidden on mobile), and optional actions
 * Shows tooltip with details on mobile
 */
export function AvatarCell({
  name,
  logoUrl,
  avatarSize = "sm",
  tooltipDetails,
  actionElement,
  avatarClassName,
  className = "flex items-center gap-2 w-10 md:w-auto",
}: AvatarCellProps) {
  const sizeClasses = {
    sm: "size-5",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const avatarSizeClass = sizeClasses[avatarSize];

  return (
    <div className={className}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className={`${avatarSizeClass} flex-shrink-0 ${avatarClassName || ""}`}>
              {logoUrl && (
                <AvatarImageNext
                  src={logoUrl}
                  alt={`${name} logo`}
                  width={avatarSize === "sm" ? 20 : avatarSize === "md" ? 32 : 40}
                  height={avatarSize === "sm" ? 20 : avatarSize === "md" ? 32 : 40}
                  quality={100}
                />
              )}
              <AvatarFallback
                className={`${
                  avatarSize === "sm"
                    ? "text-[9px]"
                    : avatarSize === "md"
                      ? "text-xs"
                      : "text-sm"
                } font-medium ${avatarClassName?.includes("rounded-none") ? "rounded-none" : ""} ${avatarClassName?.includes("bg-accent") ? "bg-accent text-accent-foreground" : ""}`}
              >
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent side="right" className="md:hidden">
            <div className="flex flex-col gap-1">
              <p className="font-medium">{name}</p>
              {tooltipDetails?.map((detail, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  {detail.label ? `${detail.label}: ${detail.value}` : detail.value}
                </p>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span className="truncate hidden md:inline">{name}</span>

      {actionElement}
    </div>
  );
}
