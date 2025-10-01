"use client";

import { forwardRef, useState, useEffect, useMemo } from "react";
import { Command } from "cmdk";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@midday/ui/cn";
import { BaseModal } from "./base-modal";
import type { BaseOverlayProps, CommandItem, CommandGroup } from "../types";
import { keyboardUtils } from "../utils";

export interface CommandPaletteProps extends Omit<BaseOverlayProps, "children"> {
  /** Array of command items */
  items?: CommandItem[];
  /** Array of command groups */
  groups?: CommandGroup[];
  /** Placeholder text for search input */
  placeholder?: string;
  /** Maximum number of items to show */
  maxItems?: number;
  /** Whether to show keyboard shortcuts */
  showShortcuts?: boolean;
  /** Custom search filter function */
  filter?: (value: string, search: string) => number;
  /** Callback when a command is selected */
  onSelect?: (item: CommandItem) => void;
  /** Custom empty state content */
  emptyState?: React.ReactNode;
  /** Custom loading state */
  loadingState?: React.ReactNode;
  /** Whether commands are loading */
  loading?: boolean;
}

/**
 * Command palette with search and keyboard navigation
 * 
 * Features:
 * - Fuzzy search across commands
 * - Keyboard shortcuts display
 * - Grouped commands with categories
 * - Keyboard navigation (arrow keys, enter, escape)
 * - Custom filtering and empty states
 * - Loading states for async commands
 * 
 * @example
 * ```tsx
 * function AppCommandPalette() {
 *   const [open, setOpen] = useState(false);
 *   
 *   const commands = [
 *     {
 *       id: "create-customer",
 *       label: "Create Customer",
 *       description: "Add a new customer to the system",
 *       icon: <UserPlus />,
 *       shortcut: ["cmd", "shift", "c"],
 *       category: "customers",
 *       onSelect: () => {
 *         setOpen(false);
 *         // Handle command
 *       }
 *     }
 *   ];
 *   
 *   return (
 *     <CommandPalette
 *       open={open}
 *       onOpenChange={setOpen}
 *       items={commands}
 *       placeholder="Search commands..."
 *       showShortcuts
 *     />
 *   );
 * }
 * ```
 */
export const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(
  (
    {
      open = false,
      onOpenChange,
      items = [],
      groups = [],
      placeholder = "Search commands...",
      maxItems = 10,
      showShortcuts = true,
      filter,
      onSelect,
      emptyState,
      loadingState,
      loading = false,
      animation = { preset: "scale" },
      ...props
    },
    ref
  ) => {
    const [search, setSearch] = useState("");

    // Clear search when dialog closes
    useEffect(() => {
      if (!open) {
        setSearch("");
      }
    }, [open]);

    // Combine items and grouped items
    const allItems = useMemo(() => {
      const combinedItems = [...items];
      
      // Add items from groups
      groups.forEach((group) => {
        group.items.forEach((item) => {
          combinedItems.push({
            ...item,
            category: item.category || group.label,
          });
        });
      });
      
      return combinedItems;
    }, [items, groups]);

    // Handle item selection
    const handleSelect = (item: CommandItem) => {
      onSelect?.(item);
      item.onSelect();
    };

    // Custom empty state
    const defaultEmptyState = (
      <div className="py-6 text-center text-sm text-muted-foreground">
        {search ? (
          <>
            No commands found for "<span className="font-medium">{search}</span>"
          </>
        ) : (
          "No commands available"
        )}
      </div>
    );

    // Custom loading state
    const defaultLoadingState = (
      <div className="py-6 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading commands...
        </div>
      </div>
    );

    return (
      <BaseModal
        ref={ref}
        open={open}
        onOpenChange={onOpenChange}
        size="lg"
        centered
        showCloseButton={false}
        className="overflow-hidden p-0"
        animation={animation}
        {...props}
      >
        <Command
          filter={filter}
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
        >
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder={placeholder}
              value={search}
              onValueChange={setSearch}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Command List */}
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            {/* Loading State */}
            {loading && (
              <Command.Loading>
                {loadingState || defaultLoadingState}
              </Command.Loading>
            )}

            {/* Empty State */}
            <Command.Empty>
              {emptyState || defaultEmptyState}
            </Command.Empty>

            {/* Grouped Items */}
            {groups.map((group) => (
              <Command.Group key={group.label} heading={group.label}>
                {group.items.slice(0, maxItems).map((item) => (
                  <CommandItem
                    key={item.id}
                    item={item}
                    showShortcuts={showShortcuts}
                    onSelect={() => handleSelect(item)}
                  />
                ))}
              </Command.Group>
            ))}

            {/* Ungrouped Items */}
            {items.length > 0 && (
              <Command.Group>
                {items.slice(0, maxItems).map((item) => (
                  <CommandItem
                    key={item.id}
                    item={item}
                    showShortcuts={showShortcuts}
                    onSelect={() => handleSelect(item)}
                  />
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div className="border-t px-3 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">↑↓</span>
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">↵</span>
                </kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">esc</span>
                </kbd>
                <span>Close</span>
              </div>
            </div>
          </div>
        </Command>
      </BaseModal>
    );
  }
);

CommandPalette.displayName = "CommandPalette";

/**
 * Individual command item component
 */
interface CommandItemProps {
  item: CommandItem;
  showShortcuts: boolean;
  onSelect: () => void;
}

function CommandItem({ item, showShortcuts, onSelect }: CommandItemProps) {
  return (
    <Command.Item
      value={item.label}
      disabled={item.disabled}
      onSelect={onSelect}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
        "aria-selected:bg-accent aria-selected:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "flex items-center gap-3"
      )}
    >
      {/* Icon */}
      {item.icon && (
        <div className="flex h-4 w-4 items-center justify-center">
          {item.icon}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 space-y-1">
        <div className="font-medium">{item.label}</div>
        {item.description && (
          <div className="text-xs text-muted-foreground">
            {item.description}
          </div>
        )}
      </div>

      {/* Shortcut */}
      {showShortcuts && item.shortcut && (
        <div className="flex items-center gap-1">
          {item.shortcut.map((key, index) => (
            <kbd
              key={index}
              className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100"
            >
              {keyboardUtils.formatShortcut([key])}
            </kbd>
          ))}
        </div>
      )}

      {/* Arrow for commands with submenus */}
      {item.category && (
        <ArrowRight className="h-4 w-4 opacity-50" />
      )}
    </Command.Item>
  );
}