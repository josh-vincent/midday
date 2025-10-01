"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  CreditCard, 
  Mail, 
  Database, 
  GitBranch, 
  Webhook,
  Settings,
  ArrowRight,
  Package
} from "lucide-react";

const packages = [
  {
    title: "@midday/stripe-sync",
    description: "Stripe subscription management and webhook handling with automatic database synchronization",
    icon: CreditCard,
    href: "/packages/stripe",
    status: "production",
    features: [
      "Webhook signature verification",
      "Automatic database sync",
      "Checkout session creation",
      "Subscription management"
    ]
  },
  {
    title: "@midday/email-providers",
    description: "Email integration for Gmail and Outlook with sync capabilities and real-time updates",
    icon: Mail,
    href: "/packages/email",
    status: "production",
    features: [
      "Gmail API integration",
      "Microsoft Graph for Outlook",
      "Email sync & search",
      "Webhook support"
    ]
  },
  {
    title: "@midday/queue",
    description: "Reliable job queue system using BullMQ and Redis for webhook processing and background tasks",
    icon: GitBranch,
    href: "/packages/queue",
    status: "production",
    features: [
      "Webhook processing",
      "Retry logic",
      "Dead letter queue",
      "Job monitoring"
    ]
  },
  {
    title: "@midday/db",
    description: "Database schema and utilities using Drizzle ORM with PostgreSQL/Supabase",
    icon: Database,
    href: "/packages/database",
    status: "production",
    features: [
      "Stripe integration tables",
      "Team management",
      "Type-safe queries",
      "Migration system"
    ]
  }
];

export default function PackagesPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Package Showcase</h1>
        <p className="text-muted-foreground text-lg">
          Explore the reusable packages built for invoice and fire services platforms
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {packages.map((pkg) => {
          const Icon = pkg.icon;
          return (
            <Card key={pkg.title} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{pkg.title}</CardTitle>
                      <Badge 
                        variant={pkg.status === "production" ? "default" : "secondary"}
                        className="mt-2"
                      >
                        {pkg.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-3">
                  {pkg.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <h4 className="text-sm font-semibold text-muted-foreground">Key Features:</h4>
                  <ul className="text-sm space-y-1">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={pkg.href}>
                  <Button className="w-full group">
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-muted/50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Package className="h-6 w-6 text-muted-foreground mt-1" />
          <div>
            <h2 className="text-lg font-semibold mb-2">Integration Status</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Webhook className="h-4 w-4 text-green-500" />
                <span className="text-sm">Stripe Webhooks: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-green-500" />
                <span className="text-sm">Email Sync: Configured</span>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-green-500" />
                <span className="text-sm">Database: Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4 text-green-500" />
                <span className="text-sm">Queue System: Running</span>
              </div>
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Edge Functions: 3 Deployed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}