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
  Download
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { billingAPI, type MockSubscription, type MockPlan, type MockUsage } from "@/lib/mock/billing-mock";

export default function SettingsBillingPage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [subscription, setSubscription] = useState<MockSubscription | null>(null);
  const [plan, setPlan] = useState<MockPlan | null>(null);
  const [usage, setUsage] = useState<MockUsage | null>(null);
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
        const userSubscription = await billingAPI.getUserSubscription(currentUser.id);
        setSubscription(userSubscription);

        if (userSubscription) {
          const subscriptionPlan = await billingAPI.getPlan(userSubscription.planId);
          setPlan(subscriptionPlan);
        }

        const currentUsage = await billingAPI.getCurrentUsage(currentUser.id);
        setUsage(currentUsage);
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

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading billing information...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const daysUntilRenewal = getDaysUntilRenewal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          <h1 className="text-2xl font-bold">Billing</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your subscription, usage, and payment methods.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            <Button onClick={() => router.push("/billing/plans")} variant="outline" size="sm">
              View All Plans
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </CardTitle>
          <CardDescription>
            Your current subscription details
          </CardDescription>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">Next billing</div>
                  <div className="font-medium">
                    {subscription.currentPeriodEnd.toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {daysUntilRenewal} days
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

      {/* Usage Statistics */}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your billing and subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push("/billing/plans")}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Upgrade Plan</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push("/billing/invoices")}
            >
              <Download className="h-5 w-5" />
              <span>View Invoices</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push("/billing")}
            >
              <CreditCard className="h-5 w-5" />
              <span>Payment Methods</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 p-4"
              onClick={() => router.push("/billing")}
            >
              <Calendar className="h-5 w-5" />
              <span>Billing History</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
            <CardDescription>
              Account and subscription details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Customer ID</Label>
                <p className="text-sm text-muted-foreground">{user.id}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Subscription ID</Label>
                <p className="text-sm text-muted-foreground">{subscription.id}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Current Period</Label>
                <p className="text-sm text-muted-foreground">
                  {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium">Started</Label>
                <p className="text-sm text-muted-foreground">
                  {subscription.createdAt.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}