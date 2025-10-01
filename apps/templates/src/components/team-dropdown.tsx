"use client";

import { Avatar, AvatarFallback } from "@midday/ui/avatar";

type Props = {
  isExpanded?: boolean;
};

export function TeamDropdown({ isExpanded = false }: Props) {
  return (
    <div className="relative h-[32px]">
      {/* Avatar - fixed position that absolutely never changes */}
      <div className="fixed left-[19px] bottom-4 w-[32px] h-[32px]">
        <div className="relative w-[32px] h-[32px]">
          <Avatar className="w-[32px] h-[32px] rounded-none border border-[#DCDAD2] dark:border-[#2C2C2C]">
            <AvatarFallback className="rounded-none w-[32px] h-[32px]">
              <span className="text-xs font-medium">TS</span>
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Team name - appears to the right of the fixed avatar */}
      {isExpanded && (
        <div className="fixed left-[62px] bottom-4 h-[32px] flex items-center">
          <span className="text-sm text-primary truncate transition-opacity duration-200 ease-in-out">
            Templates Showcase
          </span>
        </div>
      )}
    </div>
  );
}