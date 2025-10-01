"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { 
  CreditCard, 
  Users, 
  FileText, 
  Package,
  Webhook,
  TrendingUp,
  DollarSign,
  Activity
} from "lucide-react";
import { SubscriptionList } from "@/components/stripe/subscription-list";
import { CustomerList } from "@/components/stripe/customer-list";
import { InvoiceList } from "@/components/stripe/invoice-list";
import { ProductCatalog } from "@/components/stripe/product-catalog";
import { WebhookEvents } from "@/components/stripe/webhook-events";
import { StripeMetrics } from "@/components/stripe/stripe-metrics";

// New DataTable components
import { DataTable as SubscriptionsDataTable } from "@/components/tables/subscriptions/data-table";
import { DataTable as CustomersDataTable } from "@/components/tables/stripe-customers/data-table";
import { SubscriptionsHeader } from "@/components/subscriptions-header";
import { StripeCustomersHeader } from "@/components/stripe-customers-header";
import { SubscriptionSheet } from "@/components/sheets/subscription-sheet";
import { CreateSubscriptionSheet } from "@/components/sheets/create-subscription-sheet";
import { StripeCustomerSheet } from "@/components/sheets/stripe-customer-sheet";

// Mock data
import { stripeAPI, type MockSubscription, type MockCustomer } from "@/lib/mock/stripe-mock";

export default function StripePage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data state
  const [subscriptions, setSubscriptions] = useState<MockSubscription[]>([]);
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [loading, setLoading] = useState({
    subscriptions: false,
    customers: false,
  });
  
  // Sheet state
  const [subscriptionSheet, setSubscriptionSheet] = useState<{
    open: boolean;
    subscription?: MockSubscription | null;
  }>({ open: false });
  
  const [createSubscriptionSheet, setCreateSubscriptionSheet] = useState(false);
  
  const [customerSheet, setCustomerSheet] = useState<{
    open: boolean;
    customer?: MockCustomer | null;
  }>({ open: false });

  // Load data
  useEffect(() => {
    loadSubscriptions();
    loadCustomers();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(prev => ({ ...prev, subscriptions: true }));
    try {
      const data = await stripeAPI.getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setLoading(prev => ({ ...prev, subscriptions: false }));
    }
  };

  const loadCustomers = async () => {
    setLoading(prev => ({ ...prev, customers: true }));
    try {
      const data = await stripeAPI.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };

  // Handlers
  const handleSubscriptionClick = (subscription: MockSubscription) => {
    setSubscriptionSheet({ open: true, subscription });
  };

  const handleCustomerClick = (customer: MockCustomer) => {
    setCustomerSheet({ open: true, customer });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stripe Integration</h1>
          <p className="text-muted-foreground mt-2">
            Complete subscription management with webhook processing
          </p>
        </div>
        <Badge variant="default" className="mt-1">
          <Activity className="w-3 h-3 mr-1" />
          Live Demo
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <StripeMetrics />
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Integration Features</CardTitle>
                <CardDescription>
                  Key capabilities of the Stripe package
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Subscription Management</p>
                      <p className="text-sm text-muted-foreground">
                        Create, update, pause, and cancel subscriptions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Webhook className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Webhook Processing</p>
                      <p className="text-sm text-muted-foreground">
                        Secure webhook handling with signature verification
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Invoice Management</p>
                      <p className="text-sm text-muted-foreground">
                        Automatic invoice generation and payment tracking
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Customer Portal</p>
                      <p className="text-sm text-muted-foreground">
                        Self-service billing portal for customers
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Package Info</CardTitle>
                <CardDescription>
                  Technical details and dependencies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-mono">@midday/stripe-sync</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Version</span>
                    <span>1.0.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dependencies</span>
                    <span>stripe, bullmq, drizzle</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Database Tables</span>
                    <span>10+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Webhook Events</span>
                    <span>20+</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <SubscriptionsHeader
            onCreateSubscription={() => setCreateSubscriptionSheet(true)}
            onRefresh={loadSubscriptions}
            totalCount={subscriptions.length}
            activeCount={subscriptions.filter(s => s.status === "active").length}
            isLoading={loading.subscriptions}
          />
          <SubscriptionsDataTable
            data={subscriptions}
            loading={loading.subscriptions}
            onSubscriptionClick={handleSubscriptionClick}
            onEditSubscription={(subscription) => setSubscriptionSheet({ open: true, subscription })}
            onViewSubscription={(subscription) => setSubscriptionSheet({ open: true, subscription })}
            onCreateSubscription={() => setCreateSubscriptionSheet(true)}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <StripeCustomersHeader
            onCreateCustomer={() => setCustomerSheet({ open: true, customer: null })}
            onRefresh={loadCustomers}
            totalCount={customers.length}
            activeCount={customers.filter(c => c.status === "active").length}
            totalRevenue={customers.reduce((sum, c) => sum + c.totalSpent, 0)}
            isLoading={loading.customers}
          />
          <CustomersDataTable
            data={customers}
            loading={loading.customers}
            onCustomerClick={handleCustomerClick}
            onEditCustomer={(customer) => setCustomerSheet({ open: true, customer })}
            onViewCustomer={(customer) => setCustomerSheet({ open: true, customer })}
            onCreateCustomer={() => setCustomerSheet({ open: true, customer: null })}
          />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceList />
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <ProductCatalog />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <WebhookEvents />
        </TabsContent>
      </Tabs>

      {/* Sheet Components */}
      <SubscriptionSheet
        subscription={subscriptionSheet.subscription}
        open={subscriptionSheet.open}
        onOpenChange={(open) => setSubscriptionSheet({ open, subscription: null })}
      />

      <CreateSubscriptionSheet
        open={createSubscriptionSheet}
        onOpenChange={setCreateSubscriptionSheet}
      />

      <StripeCustomerSheet
        customer={customerSheet.customer}
        open={customerSheet.open}
        onOpenChange={(open) => setCustomerSheet({ open, customer: null })}
      />
    </div>
  );
}