"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@midday/ui/cn";
import { Button } from "@midday/ui/button";
import { 
  CreditCard, 
  Mail, 
  GitBranch, 
  Database,
  Home,
  Moon,
  Sun,
  Package,
  BarChart3,
  Receipt,
  FileText,
  Users,
  Briefcase,
  FileStack,
  Clock,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useTheme } from "next-themes";

const navigation = [
  { name: "Overview", href: "/", icon: Home },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Documents", href: "/documents", icon: FileStack },
  { name: "Time", href: "/time", icon: Clock },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Reports", href: "/reports", icon: TrendingUp },
  { name: "Charts", href: "/charts", icon: BarChart3 },
  { name: "Stripe", href: "/stripe", icon: CreditCard },
  { name: "Email", href: "/email", icon: Mail },
  { name: "Queue", href: "/queue", icon: GitBranch },
  { name: "Database", href: "/database", icon: Database },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <span className="font-semibold text-xl">Package Templates</span>
            </Link>
            
            <div className="flex space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== "/" && pathname.startsWith(item.href));
                
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}