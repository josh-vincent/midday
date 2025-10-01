"use client";

import { cn } from "@midday/ui/cn";
import { Badge } from "@midday/ui/badge";
import { roleUtils } from "@/lib/utils/roles";

interface RoleBadgeProps {
  roleId: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "secondary";
  showIcon?: boolean;
  showLevel?: boolean;
  className?: string;
}

export function RoleBadge({ 
  roleId, 
  size = "md", 
  variant = "default",
  showIcon = true,
  showLevel = false,
  className 
}: RoleBadgeProps) {
  const role = roleUtils.getRole(roleId);
  
  if (!role) {
    return (
      <Badge variant="outline" className={cn("opacity-50", className)}>
        Unknown Role
      </Badge>
    );
  }

  const IconComponent = role.icon;
  
  const sizeClasses = {
    sm: "h-5 text-xs px-2",
    md: "h-6 text-sm px-2.5",
    lg: "h-7 text-base px-3"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-4 w-4"
  };

  // Get role color for background
  const getRoleColorStyle = () => {
    if (variant !== "default") return {};
    
    const colorMap: Record<string, string> = {
      'bg-purple-500': '#8b5cf6',
      'bg-red-500': '#ef4444',
      'bg-blue-500': '#3b82f6',
      'bg-green-500': '#22c55e',
      'bg-gray-500': '#6b7280',
      'bg-orange-500': '#f97316',
      'bg-yellow-500': '#eab308',
      'bg-pink-500': '#ec4899',
    };
    
    const color = colorMap[role.color] || colorMap['bg-gray-500'];
    return {
      backgroundColor: color,
      color: 'white',
      borderColor: color
    };
  };

  return (
    <Badge 
      variant={variant}
      className={cn(
        sizeClasses[size],
        "inline-flex items-center gap-1.5 font-medium",
        variant === "default" && "border-0",
        className
      )}
      style={getRoleColorStyle()}
    >
      {showIcon && IconComponent && (
        <IconComponent className={iconSizes[size]} />
      )}
      <span>{role.name}</span>
      {showLevel && (
        <span className="text-xs opacity-75">
          ({role.level})
        </span>
      )}
    </Badge>
  );
}

interface RoleBadgeListProps {
  roleIds: string[];
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "secondary";
  showIcon?: boolean;
  showLevel?: boolean;
  className?: string;
}

export function RoleBadgeList({
  roleIds,
  max = 3,
  size = "sm",
  variant = "outline",
  showIcon = false,
  showLevel = false,
  className
}: RoleBadgeListProps) {
  const displayRoles = roleIds.slice(0, max);
  const remainingCount = roleIds.length - max;

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {displayRoles.map(roleId => (
        <RoleBadge
          key={roleId}
          roleId={roleId}
          size={size}
          variant={variant}
          showIcon={showIcon}
          showLevel={showLevel}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className={cn(
          size === "sm" && "h-5 text-xs px-2",
          size === "md" && "h-6 text-sm px-2.5", 
          size === "lg" && "h-7 text-base px-3",
          "opacity-75"
        )}>
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

interface RoleSelectBadgeProps {
  roleId: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  showLevel?: boolean;
  className?: string;
}

export function RoleSelectBadge({
  roleId,
  selected = false,
  onClick,
  size = "md",
  showIcon = true,
  showLevel = false,
  className
}: RoleSelectBadgeProps) {
  const role = roleUtils.getRole(roleId);
  
  if (!role) return null;

  const IconComponent = role.icon;
  
  const sizeClasses = {
    sm: "h-8 text-xs px-3",
    md: "h-10 text-sm px-4",
    lg: "h-12 text-base px-5"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        sizeClasses[size],
        "inline-flex items-center gap-2 rounded-lg border-2 transition-all",
        "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-md"
          : "border-border bg-background hover:border-primary/50",
        className
      )}
    >
      {showIcon && IconComponent && (
        <IconComponent className={iconSizes[size]} />
      )}
      <div className="flex flex-col items-start gap-1">
        <span className="font-medium">{role.name}</span>
        {showLevel && (
          <span className={cn(
            "text-xs opacity-75",
            size === "sm" && "hidden"
          )}>
            Level {role.level}
          </span>
        )}
      </div>
    </button>
  );
}

export default RoleBadge;