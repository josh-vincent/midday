"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@midday/ui/sheet";
import { Menu, Settings } from "lucide-react";
import { SettingsNav, SettingsNavMobile, useCurrentSettingsSection } from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentSection = useCurrentSettingsSection();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 border-b">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        <h2 className="text-lg font-semibold">Settings</h2>
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <SettingsNav mobile />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Settings</span>
              {currentSection && (
                <>
                  <span className="text-sm text-muted-foreground">/</span>
                  <span className="text-sm font-medium">{currentSection.name}</span>
                </>
              )}
            </div>

            {/* Mobile navigation */}
            <div className="lg:hidden">
              <div className="w-8" /> {/* Spacer for balance */}
            </div>
          </div>

          {/* Mobile horizontal navigation */}
          <div className="lg:hidden border-t">
            <SettingsNavMobile className="px-1 py-2" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Settings</h2>
                <SettingsNav />
              </div>

              {/* Help section */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <h3 className="font-medium mb-2">Need help?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Check our documentation or contact support for assistance.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    View Documentation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="lg:col-span-9">
            <div className="max-w-4xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}