"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@midday/ui/button";
import { Card, CardContent } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Switch } from "@midday/ui/switch";
import { Label } from "@midday/ui/label";
import { useToast } from "@midday/ui/use-toast";
import { 
  ArrowLeft,
  Check,
  X,
  Zap,
  Users,
  Database,
  TrendingUp
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { billingAPI, type MockPlan, type MockSubscription } from "@/lib/mock/billing-mock";
import { PlanCard } from "@/components/billing/plan-card";

export default function PlansPage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [plans, setPlans] = useState<MockPlan[]>([]);
  const [subscription, setSubscription] = useState<MockSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MockPlan | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [currentUser, allPlans] = await Promise.all([
        authAPI.getCurrentUser(),
        billingAPI.getPlans(),
      ]);

      setUser(currentUser);
      setPlans(allPlans);

      if (currentUser) {
        const userSubscription = await billingAPI.getUserSubscription(currentUser.id);
        setSubscription(userSubscription);

        if (userSubscription) {
          const plan = allPlans.find(p => p.id === userSubscription.planId);
          setCurrentPlan(plan || null);
        }
      }
    } catch (error) {
      console.error("Failed to load plans data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    if (!user) return;

    setUpgrading(true);
    try {
      // In a real app, this would redirect to payment flow
      router.push(`/billing/upgrade?plan=${planId}&yearly=${isYearly}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to proceed to upgrade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const getFilteredPlans = () => {
    if (isYearly) {
      return plans.filter(plan => plan.interval === 'year' || plan.id === 'free');
    }
    return plans.filter(plan => plan.interval === 'month' || plan.id === 'free');
  };

  const featureMatrix = [
    { 
      feature: "Team members", 
      free: "5", 
      pro: "50", 
      enterprise: "Unlimited" 
    },
    { 
      feature: "Teams", 
      free: "1", 
      pro: "Unlimited", 
      enterprise: "Unlimited" 
    },
    { 
      feature: "Storage", 
      free: "5GB", 
      pro: "100GB", 
      enterprise: "1TB" 
    },
    { 
      feature: "API calls per month", 
      free: "1,000", 
      pro: "50,000", 
      enterprise: "Unlimited" 
    },
    { 
      feature: "Integrations", 
      free: "3", 
      pro: "Unlimited", 
      enterprise: "Unlimited" 
    },
    { 
      feature: "Basic support", 
      free: true, 
      pro: true, 
      enterprise: true 
    },
    { 
      feature: "Priority support", 
      free: false, 
      pro: true, 
      enterprise: true 
    },
    { 
      feature: "24/7 phone support", 
      free: false, 
      pro: false, 
      enterprise: true 
    },
    { 
      feature: "Advanced analytics", 
      free: false, 
      pro: true, 
      enterprise: true 
    },
    { 
      feature: "Custom roles", 
      free: false, 
      pro: true, 
      enterprise: true 
    },
    { 
      feature: "Audit logs", 
      free: false, 
      pro: true, 
      enterprise: true 
    },
    { 
      feature: "SSO & SAML", 
      free: false, 
      pro: false, 
      enterprise: true 
    },
    { 
      feature: "Custom onboarding", 
      free: false, 
      pro: false, 
      enterprise: true 
    },
    { 
      feature: "Dedicated account manager", 
      free: false, 
      pro: false, 
      enterprise: true 
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
      </div>
    );
  }

  const filteredPlans = getFilteredPlans();
  const yearlySavings = Math.round((plans.find(p => p.id === 'pro')?.price || 0) * 12 * 0.2);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">Choose your plan</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Select the perfect plan for your team's needs. Upgrade or downgrade at any time.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <Label htmlFor="yearly" className={!isYearly ? 'font-medium' : 'text-muted-foreground'}>
                Monthly
              </Label>
              <Switch
                id="yearly"
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <div className="flex items-center gap-2">
                <Label htmlFor="yearly" className={isYearly ? 'font-medium' : 'text-muted-foreground'}>
                  Yearly
                </Label>
                {yearlySavings > 0 && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Save ${yearlySavings}/month
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlanId={currentPlan?.id}
                isYearly={isYearly}
                onSelectPlan={handleSelectPlan}
                loading={upgrading}
              />
            ))}
          </div>

          {/* Feature Matrix */}
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-2xl font-bold text-center">Compare all features</h2>
                  <p className="text-muted-foreground text-center mt-2">
                    Detailed breakdown of what's included in each plan
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Features</th>
                        <th className="text-center p-4 font-medium">Free</th>
                        <th className="text-center p-4 font-medium relative">
                          Pro
                          {plans.find(p => p.id === 'pro')?.popular && (
                            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500">
                              Popular
                            </Badge>
                          )}
                        </th>
                        <th className="text-center p-4 font-medium">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {featureMatrix.map((row, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="p-4 font-medium">{row.feature}</td>
                          <td className="p-4 text-center">
                            {typeof row.free === 'boolean' ? (
                              row.free ? (
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-500 mx-auto" />
                              )
                            ) : (
                              row.free
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {typeof row.pro === 'boolean' ? (
                              row.pro ? (
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-500 mx-auto" />
                              )
                            ) : (
                              row.pro
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {typeof row.enterprise === 'boolean' ? (
                              row.enterprise ? (
                                <Check className="h-5 w-5 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-500 mx-auto" />
                              )
                            ) : (
                              row.enterprise
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-center">Frequently asked questions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                    and you'll be charged or credited for the difference.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                  <p className="text-muted-foreground text-sm">
                    We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. 
                    Enterprise customers can also pay by invoice.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes! All paid plans come with a 14-day free trial. No credit card required to start. 
                    You can cancel anytime during the trial period.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">What happens to my data if I cancel?</h3>
                  <p className="text-muted-foreground text-sm">
                    Your data is safe. You can export all your data before canceling, and we'll keep 
                    it for 30 days after cancellation in case you want to reactivate.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Sales */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Need a custom solution?</h2>
            <p className="text-muted-foreground">
              For enterprise customers with specific requirements, we offer custom plans and pricing.
            </p>
            <Button size="lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}