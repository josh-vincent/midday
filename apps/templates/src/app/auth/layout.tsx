import Link from "next/link";
import { Button } from "@midday/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </Link>
        
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">Templates</span>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">T</span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-6">
        <p className="text-sm text-muted-foreground">
          © 2024 Templates. Built with{" "}
          <Link href="https://midday.ai" className="hover:underline">
            Midday UI
          </Link>
        </p>
      </footer>
    </div>
  );
}