"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const icons = {
  "/": () => <Icons.Overview size={20} />,
  "/transactions": () => <Icons.Transactions size={20} />,
  "/invoices": () => <Icons.Invoice size={20} />,
  "/customers": () => <Icons.Customers size={20} />,
  "/jobs": () => <Icons.Apps size={20} />,
  "/documents": () => <Icons.Inbox2 size={20} />,
  "/time": () => <Icons.TimeDuration size={20} />,
  "/calendar": () => <Icons.CalendarMonth size={20} />,
  "/reports": () => <Icons.Overview size={20} />,
  "/charts": () => <Icons.Overview size={20} />,
  // Packages section
  "/packages": () => <Icons.Apps size={20} />,
  "/packages/communications": () => <Icons.Email size={20} />,
  "/packages/compliance": () => <Icons.Invoice size={20} />,
  "/packages/email-providers": () => <Icons.Email size={20} />,
  "/packages/import-export": () => <Icons.ProjectStatus size={20} />,
  "/packages/invoice-core": () => <Icons.Invoice size={20} />,
  "/packages/payments": () => <Icons.Vault size={20} />,
  "/packages/queue": () => <Icons.Apps size={20} />,
  "/packages/search": () => <Icons.Search size={20} />,
  "/packages/storage": () => <Icons.Vault size={20} />,
  "/packages/stripe-sync": () => <Icons.Vault size={20} />,
  "/packages/webhooks": () => <Icons.Link size={20} />,
  // New component packages
  "/packages/table-components": () => <Icons.ProjectStatus size={20} />,
  "/packages/filter-components": () => <Icons.Search size={20} />,
  "/packages/overlay-components": () => <Icons.Apps size={20} />,
  "/packages/crud-components": () => <Icons.Vault size={20} />,
  "/packages/form-components": () => <Icons.Invoice size={20} />,
  "/packages/invoice-components": () => <Icons.Invoice size={20} />,
  // Platform section
  "/roles": () => <Icons.Customers size={20} />,
  "/permissions": () => <Icons.Invoice size={20} />,
  "/teams": () => <Icons.Customers size={20} />,
  // Infrastructure
  "/email": () => <Icons.Email size={20} />,
  "/database": () => <Icons.Vault size={20} />,
  "/stripe": () => <Icons.Vault size={20} />,
  "/settings": () => <Icons.Settings size={20} />,
} as const;

const items = [
  { path: "/", name: "Overview" },
  { 
    path: "/features",
    name: "Features",
    children: [
      { path: "/transactions", name: "Transactions" },
      { path: "/invoices", name: "Invoices" },
      { path: "/customers", name: "Customers" },
      { path: "/jobs", name: "Jobs" },
      { path: "/documents", name: "Documents" },
      { path: "/time", name: "Time Tracking" },
      { path: "/calendar", name: "Calendar" },
      { path: "/reports", name: "Reports" },
      { path: "/charts", name: "Charts" },
    ]
  },
  {
    path: "/packages",
    name: "Packages",
    children: [
      { path: "/packages", name: "All Packages" },
      { path: "/packages/table-components", name: "Table Components" },
      { path: "/packages/filter-components", name: "Filter Components" },
      { path: "/packages/overlay-components", name: "Overlay Components" },
      { path: "/packages/crud-components", name: "CRUD Components" },
      { path: "/packages/form-components", name: "Form Components" },
      { path: "/packages/invoice-components", name: "Invoice Components" },
      { path: "/packages/communications", name: "Communications" },
      { path: "/packages/compliance", name: "Compliance" },
      { path: "/packages/email-providers", name: "Email Providers" },
      { path: "/packages/import-export", name: "Import/Export" },
      { path: "/packages/invoice-core", name: "Invoice Core" },
      { path: "/packages/payments", name: "Payments" },
      { path: "/packages/queue", name: "Queue" },
      { path: "/packages/search", name: "Search" },
      { path: "/packages/storage", name: "Storage" },
      { path: "/packages/stripe-sync", name: "Stripe Sync" },
      { path: "/packages/webhooks", name: "Webhooks" },
    ]
  },
  {
    path: "/platform",
    name: "Platform",
    children: [
      { path: "/roles", name: "Roles" },
      { path: "/permissions", name: "Permissions" },
      { path: "/teams", name: "Teams" },
    ]
  },
  {
    path: "/infrastructure",
    name: "Infrastructure", 
    children: [
      { path: "/email", name: "Email" },
      { path: "/queue", name: "Queue" },
      { path: "/database", name: "Database" },
      { path: "/stripe", name: "Stripe" },
    ]
  },
  { path: "/settings", name: "Settings" },
];

interface ItemProps {
  item: {
    path: string;
    name: string;
    children?: { path: string; name: string }[];
  };
  isActive: boolean;
  isExpanded: boolean;
  isItemExpanded: boolean;
  onToggle: (path: string) => void;
  onSelect?: () => void;
}

const ChildItem = ({
  child,
  isActive,
  isExpanded,
  shouldShow,
  onSelect,
  index,
}: {
  child: { path: string; name: string };
  isActive: boolean;
  isExpanded: boolean;
  shouldShow: boolean;
  onSelect?: () => void;
  index: number;
}) => {
  const showChild = isExpanded && shouldShow;

  return (
    <Link
      prefetch
      href={child.path}
      onClick={() => onSelect?.()}
      className="block group/child"
    >
      <div className="relative">
        {/* Child item text */}
        <div
          className={cn(
            "ml-[35px] mr-[15px] h-[32px] flex items-center",
            "border-l border-[#DCDAD2] dark:border-[#2C2C2C] pl-3",
            "transition-all duration-200 ease-out",
            showChild
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2",
          )}
          style={{
            transitionDelay: showChild
              ? `${40 + index * 20}ms`
              : `${index * 20}ms`,
          }}
        >
          <span
            className={cn(
              "text-xs font-medium transition-colors duration-200",
              "text-[#888] group-hover/child:text-primary",
              "whitespace-nowrap overflow-hidden",
              isActive && "text-primary",
            )}
          >
            {child.name}
          </span>
        </div>
      </div>
    </Link>
  );
};

const Item = ({
  item,
  isActive,
  isExpanded,
  isItemExpanded,
  onToggle,
  onSelect,
}: ItemProps) => {
  const Icon = icons[item.path as keyof typeof icons];
  const pathname = usePathname();
  const hasChildren = item.children && item.children.length > 0;

  // Children should be visible when: expanded sidebar AND this item is expanded
  const shouldShowChildren = isExpanded && isItemExpanded;

  const handleChevronClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggle(item.path);
  };

  return (
    <div className="group">
      <Link
        prefetch
        href={item.path}
        onClick={() => onSelect?.()}
        className="group"
      >
        <div className="relative">
          {/* Background that expands */}
          <div
            className={cn(
              "border border-transparent h-[40px] transition-all duration-200 ml-[15px] mr-[15px]",
              isActive &&
                "bg-[#F2F1EF] dark:bg-secondary border-[#DCDAD2] dark:border-[#2C2C2C]",
              isExpanded ? "w-[calc(100%-30px)]" : "w-[40px]",
            )}
          />

          {/* Icon - always in same position from sidebar edge */}
          <div className="absolute top-0 left-[15px] w-[40px] h-[40px] flex items-center justify-center dark:text-[#666666] text-black group-hover:!text-primary pointer-events-none">
            <div className={cn(isActive && "dark:!text-white")}>
              {Icon ? <Icon /> : <Icons.Apps size={20} />}
            </div>
          </div>

          {isExpanded && (
            <div className="absolute top-0 left-[55px] right-[4px] h-[40px] flex items-center pointer-events-none">
              <span
                className={cn(
                  "text-sm font-medium transition-opacity duration-200 ease-in-out text-[#666] group-hover:text-primary",
                  "whitespace-nowrap overflow-hidden",
                  hasChildren ? "pr-2" : "",
                  isActive && "text-primary",
                )}
              >
                {item.name}
              </span>
              {hasChildren && (
                <button
                  type="button"
                  onClick={handleChevronClick}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center transition-all duration-200 ml-auto mr-3",
                    "text-[#888] hover:text-primary pointer-events-auto",
                    isActive && "text-primary/60",
                    shouldShowChildren && "rotate-180",
                  )}
                >
                  <Icons.ChevronDown size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Children */}
      {hasChildren && (
        <div
          className={cn(
            "transition-all duration-300 ease-out overflow-hidden",
            shouldShowChildren ? "max-h-96 mt-1" : "max-h-0",
          )}
        >
          {item.children!.map((child, index) => {
            const isChildActive = pathname === child.path;
            return (
              <ChildItem
                key={child.path}
                child={child}
                isActive={isChildActive}
                isExpanded={isExpanded}
                shouldShow={shouldShowChildren}
                onSelect={onSelect}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

type Props = {
  onSelect?: () => void;
  isExpanded?: boolean;
};

export function MainMenu({ onSelect, isExpanded = false }: Props) {
  const pathname = usePathname();
  const part = pathname?.split("/")[1];
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Reset expanded item when sidebar expands/collapses
  useEffect(() => {
    setExpandedItem(null);
  }, [isExpanded]);

  return (
    <div className="mt-6 w-full">
      <nav className="w-full">
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const isActive =
              (pathname === "/" && item.path === "/") ||
              (pathname !== "/" && item.path.startsWith(`/${part}`));

            return (
              <Item
                key={item.path}
                item={item}
                isActive={isActive}
                isExpanded={isExpanded}
                isItemExpanded={expandedItem === item.path}
                onToggle={(path) => {
                  setExpandedItem(expandedItem === path ? null : path);
                }}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </nav>
    </div>
  );
}