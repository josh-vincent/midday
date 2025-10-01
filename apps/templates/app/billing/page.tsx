"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Progress } from "@midday/ui/progress";
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  Users, 
  Database, 
  Zap,
  ArrowUpRight,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { billingAPI, type MockSubscription, type MockPlan, type MockUsage, type MockPaymentMethod, type MockInvoice } from "@/lib/mock/billing-mock";

export default function BillingPage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [subscription, setSubscription] = useState<MockSubscription | null>(null);
  const [plan, setPlan] = useState<MockPlan | null>(null);
  const [usage, setUsage] = useState<MockUsage | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<MockPaymentMethod[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<MockInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const [userSubscription, userPaymentMethods, userInvoices, currentUsage] = await Promise.all([
          billingAPI.getUserSubscription(currentUser.id),
          billingAPI.getPaymentMethods(currentUser.id),
          billingAPI.getInvoices(currentUser.id),
          billingAPI.getCurrentUsage(currentUser.id),
        ]);

        setSubscription(userSubscription);
        setPaymentMethods(userPaymentMethods);
        setRecentInvoices(userInvoices.slice(0, 3)); // Last 3 invoices
        setUsage(currentUsage);

        if (userSubscription) {
          const subscriptionPlan = await billingAPI.getPlan(userSubscription.planId);
          setPlan(subscriptionPlan);
        }
      }
    } catch (error) {
      console.error("Failed to load billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number | string) => {
    if (limit === 'unlimited') return 0;
    return Math.min((used / (limit as number)) * 100, 100);
  };

  const formatStorage = (gb: number) => {
    if (gb < 1) return `${(gb * 1024).toFixed(0)} MB`;
    return `${gb.toFixed(1)} GB`;
  };

  const getDaysUntilRenewal = () => {
    if (!subscription) return 0;
    const now = new Date();
    const renewalDate = new Date(subscription.currentPeriodEnd);
    const diffTime = renewalDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Billing Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your subscription, usage, and billing information.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                    <p className="text-2xl font-bold">{plan?.name || "Free"}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Cost</p>
                    <p className="text-2xl font-bold">${plan?.price || 0}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
                    <p className="text-2xl font-bold">{daysUntilRenewal}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                    <p className="text-2xl font-bold">{usage?.users || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      of {plan?.limits.users === 'unlimited' ? '∞' : plan?.limits.users}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Subscription */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Current Subscription</span>
                    <Button onClick={() => router.push("/billing/plans")} variant="outline" size="sm">
                      Change Plan
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subscription && plan ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {plan.name}
                            {plan.popular && (
                              <Badge className="bg-gradient-to-r from-orange-500 to-red-500">
                                Popular
                              </Badge>
                            )}
                          </h3>
                          <p className="text-muted-foreground">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            ${plan.price}
                            <span className="text-sm text-muted-foreground">/{plan.interval}</span>
                          </div>
                          <Badge variant={subscription.status === 'active' ? 'success' : 'secondary'}>
                            {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">Next billing</div>
                          <div className="font-medium">
                            {subscription.currentPeriodEnd.toLocaleDateString()}
                          </div>
                        </div>

                        <div className="text-center">
                          <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">Billing cycle</div>
                          <div className="font-medium">
                            {plan.interval === 'month' ? 'Monthly' : 'Yearly'}
                          </div>
                        </div>

                        <div className="text-center">
                          <CreditCard className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">Auto-renewal</div>
                          <div className="font-medium">
                            {subscription.cancelAtPeriodEnd ? 'Disabled' : 'Enabled'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground mb-4">No active subscription</p>
                      <Button onClick={() => router.push("/billing/plans")}>
                        Choose a Plan
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Usage Overview */}
              {usage && plan && (
                <Card>
                  <CardHeader>
                    <CardTitle>Usage This Month</CardTitle>
                    <CardDescription>
                      Track your usage against plan limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Users */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Team Members</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {usage.users} / {plan.limits.users === 'unlimited' ? '∞' : plan.limits.users}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(usage.users, plan.limits.users)} 
                          className="h-2"
                        />
                      </div>

                      {/* Storage */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            <span className="font-medium">Storage</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatStorage(usage.storageUsed)} / {plan.limits.storage}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(usage.storageUsed, parseFloat(plan.limits.storage.replace(/[^0-9.]/g, '')))} 
                          className="h-2"
                        />
                      </div>

                      {/* API Calls */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span className="font-medium">API Calls</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {usage.apiCalls.toLocaleString()} / {plan.limits.apiCalls === 'unlimited' ? '∞' : (plan.limits.apiCalls as number).toLocaleString()}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(usage.apiCalls, plan.limits.apiCalls)} 
                          className="h-2"
                        />
                      </div>

                      {/* Integrations */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">Integrations</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {usage.integrations} / {plan.limits.integrations === 'unlimited' ? '∞' : plan.limits.integrations}
                          </span>
                        </div>
                        <Progress 
                          value={getUsagePercentage(usage.integrations, plan.limits.integrations)} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Recent Invoices</span>
                    <Button onClick={() => router.push("/billing/invoices")} variant="outline" size="sm">
                      View All
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentInvoices.length > 0 ? (
                    <div className="space-y-3">
                      {recentInvoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(invoice.status)}
                            <div>
                              <div className="font-medium">{invoice.description}</div>
                              <div className="text-sm text-muted-foreground">
                                {invoice.createdAt.toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium">${invoice.amount.toFixed(2)}</div>
                              <div className="text-sm text-muted-foreground">
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </div>
                            </div>
                            {invoice.downloadUrl && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No invoices found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push("/billing/plans")}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push("/billing/invoices")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoices
                  </Button>
                  
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payment Methods
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentMethods.length > 0 ? (
                    <div className="space-y-3">
                      {paymentMethods.filter(pm => pm.isDefault).map((pm) => (
                        <div key={pm.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5" />
                            <div>
                              <div className="font-medium">
                                •••• •••• •••• {pm.last4}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {pm.brand?.toUpperCase()} • Expires {pm.expiryMonth}/{pm.expiryYear}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline">Default</Badge>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full">
                        Manage Payment Methods
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-3">No payment method</p>
                      <Button size="sm">Add Payment Method</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Billing Support */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Have questions about billing or need to make changes to your account?
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full">
                        Contact Support
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        Billing FAQ
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}