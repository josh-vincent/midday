"use client";

import { cn } from "@midday/ui/cn";
import Link from "next/link";
import { useState } from "react";

export function SidebarSimple() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen flex-shrink-0 flex-col justify-between fixed top-0 pb-4 items-center hidden md:flex z-50 transition-all duration-200",
        "bg-background border-r border-border",
        isExpanded ? "w-[240px]" : "w-[70px]",
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col items-center pt-4">
        <Link href="/" className="mb-8">
          <div className="w-8 h-8 bg-gray-800 rounded"></div>
        </Link>

        <nav className="flex flex-col gap-2">
          <Link href="/" className="p-3 hover:bg-gray-100 rounded">
            <span className={cn(isExpanded ? "inline" : "hidden")}>Home</span>
          </Link>
          <Link href="/reports" className="p-3 hover:bg-gray-100 rounded">
            <span className={cn(isExpanded ? "inline" : "hidden")}>
              Reports
            </span>
          </Link>
          <Link href="/invoices" className="p-3 hover:bg-gray-100 rounded">
            <span className={cn(isExpanded ? "inline" : "hidden")}>
              Invoices
            </span>
          </Link>
        </nav>
      </div>
    </aside>
  );
}
