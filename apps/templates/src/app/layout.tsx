import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/sidebar";
import { MobileMenu } from "@/components/mobile-menu";
import { Toaster } from "@midday/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Midday Package Templates",
  description: "Showcase of reusable packages for invoice and fire services platforms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen bg-background">
            <Sidebar />
            
            <div className="md:ml-[70px] pb-8">
              {/* Mobile menu header */}
              <div className="flex items-center justify-between p-4 md:hidden border-b border-border">
                <div className="flex items-center gap-2">
                  <MobileMenu />
                  <span className="font-semibold">Templates</span>
                </div>
              </div>
              
              <main className="px-6 py-8">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}