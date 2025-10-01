import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import Link from "next/link";
import { 
  CreditCard, 
  Mail, 
  Database, 
  GitBranch, 
  ArrowRight,
  CheckCircle,
  Code,
  Zap,
  Shield,
  RefreshCw
} from "lucide-react";

const packages = [
  {
    title: "@midday/stripe-sync",
    description: "Complete Stripe integration with webhook handling and database sync",
    icon: CreditCard,
    href: "/stripe",
    status: "ready",
    features: [
      "Webhook signature verification",
      "Automatic database synchronization",
      "Checkout & billing portal",
      "Subscription lifecycle management"
    ],
    stats: {
      events: "20+ webhook events",
      tables: "10+ database tables",
      apis: "Full Stripe API coverage"
    }
  },
  {
    title: "@midday/email-providers",
    description: "Unified email integration for Gmail and Outlook",
    icon: Mail,
    href: "/email",
    status: "ready",
    features: [
      "Gmail API with OAuth2",
      "Microsoft Graph integration",
      "Real-time sync & webhooks",
      "Batch operations support"
    ],
    stats: {
      providers: "2 providers",
      operations: "15+ operations",
      sync: "Real-time updates"
    }
  },
  {
    title: "@midday/queue",
    description: "Reliable job processing with BullMQ and Redis",
    icon: GitBranch,
    href: "/queue",
    status: "ready",
    features: [
      "Webhook processing queue",
      "Exponential backoff retry",
      "Dead letter queue",
      "Job metrics & monitoring"
    ],
    stats: {
      concurrency: "Configurable",
      retries: "Auto retry logic",
      monitoring: "Built-in metrics"
    }
  },
  {
    title: "@midday/db",
    description: "Type-safe database with Drizzle ORM",
    icon: Database,
    href: "/database",
    status: "ready",
    features: [
      "Complete Stripe schema",
      "Team & user management",
      "Type-safe queries",
      "Migration system"
    ],
    stats: {
      tables: "15+ tables",
      relations: "Full relations",
      orm: "Drizzle ORM"
    }
  }
];

const features = [
  {
    icon: Zap,
    title: "Production Ready",
    description: "Battle-tested packages ready for production use"
  },
  {
    icon: Code,
    title: "TypeScript First",
    description: "Fully typed with excellent developer experience"
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Built-in security with webhook verification"
  },
  {
    icon: RefreshCw,
    title: "Auto Recovery",
    description: "Automatic retries and error handling"
  }
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <Badge className="mb-4" variant="secondary">
          Package Showcase
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Reusable Package Components
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Production-ready packages for building invoice and fire services platforms 
          with Stripe, email integration, job queues, and more.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="border-muted">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Package Cards */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold">Explore Packages</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {packages.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <Card key={pkg.title} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-mono">
                          {pkg.title}
                        </CardTitle>
                        <Badge 
                          variant="default"
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
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Features:</h4>
                    <ul className="text-sm space-y-1">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t grid grid-cols-3 gap-4 text-center">
                    {Object.entries(pkg.stats).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-muted-foreground capitalize">{key}</p>
                        <p className="text-sm font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>

                  <Link href={pkg.href}>
                    <Button className="w-full group">
                      Explore Demo
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Architecture Section */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Architecture Overview</CardTitle>
          <CardDescription>
            How the packages work together in a production environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold">Webhook Flow</h4>
                <p className="text-sm text-muted-foreground">
                  Stripe/Email webhooks → Edge Functions → Queue → Database
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Data Sync</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time sync from Stripe/Gmail/Outlook to PostgreSQL
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Error Handling</h4>
                <p className="text-sm text-muted-foreground">
                  Automatic retries with exponential backoff and DLQ
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Monitoring</h4>
                <p className="text-sm text-muted-foreground">
                  Built-in metrics, job tracking, and health checks
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}