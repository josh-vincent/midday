"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@midday/ui/cn";
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  CreditCard, 
  Key,
  ChevronRight
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navigation: NavItem[] = [
  {
    name: "Profile",
    href: "/settings/profile",
    icon: User,
    description: "Manage your profile and public information",
  },
  {
    name: "Account",
    href: "/settings/account",
    icon: Settings,
    description: "Update account settings and preferences",
  },
  {
    name: "Security",
    href: "/settings/security",
    icon: Shield,
    description: "Password, two-factor authentication, and security",
  },
  {
    name: "Notifications",
    href: "/settings/notifications",
    icon: Bell,
    description: "Configure email and push notifications",
  },
  {
    name: "Billing",
    href: "/settings/billing",
    icon: CreditCard,
    description: "Manage subscription and payment methods",
  },
  {
    name: "API Keys",
    href: "/settings/api-keys",
    icon: Key,
    description: "Create and manage API keys for integrations",
  },
];

interface SettingsNavProps {
  className?: string;
  mobile?: boolean;
}

export function SettingsNav({ className, mobile = false }: SettingsNavProps) {
  const pathname = usePathname();

  if (mobile) {
    return (
      <div className={cn("space-y-1", className)}>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <nav className={cn("space-y-1", className)}>
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "group flex flex-col gap-1 rounded-lg px-3 py-3 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <span className="font-medium">{item.name}</span>
            </div>
            <p className={cn(
              "text-xs leading-relaxed pl-6",
              isActive 
                ? "text-primary-foreground/80" 
                : "text-muted-foreground"
            )}>
              {item.description}
            </p>
          </Link>
        );
      })}
    </nav>
  );
}

// Simplified mobile-friendly version
export function SettingsNavMobile({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex overflow-x-auto space-x-1 pb-2", className)}>
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

// Get current section for breadcrumbs
export function useCurrentSettingsSection() {
  const pathname = usePathname();
  return navigation.find(item => item.href === pathname);
}