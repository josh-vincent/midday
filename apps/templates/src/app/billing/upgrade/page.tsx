"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { useToast } from "@midday/ui/use-toast";
import { 
  ArrowLeft,
  CreditCard,
  Shield,
  CheckCircle2,
  Calendar,
  Zap
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { billingAPI, type MockPlan, type MockSubscription, type MockPaymentMethod } from "@/lib/mock/billing-mock";
import { PaymentMethodForm } from "@/components/billing/payment-method-form";

export default function UpgradePage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [plan, setPlan] = useState<MockPlan | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<MockSubscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MockPlan | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<MockPaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const planId = searchParams.get('plan');
  const isYearly = searchParams.get('yearly') === 'true';

  useEffect(() => {
    loadData();
  }, [planId]);

  const loadData = async () => {
    if (!planId) {
      router.push('/billing/plans');
      return;
    }

    try {
      const [currentUser, targetPlan] = await Promise.all([
        authAPI.getCurrentUser(),
        billingAPI.getPlan(planId),
      ]);

      setUser(currentUser);
      setPlan(targetPlan);

      if (currentUser) {
        const [subscription, userPaymentMethods] = await Promise.all([
          billingAPI.getUserSubscription(currentUser.id),
          billingAPI.getPaymentMethods(currentUser.id),
        ]);

        setCurrentSubscription(subscription);
        setPaymentMethods(userPaymentMethods);

        if (subscription) {
          const userCurrentPlan = await billingAPI.getPlan(subscription.planId);
          setCurrentPlan(userCurrentPlan);
        }

        // Auto-select default payment method
        const defaultPaymentMethod = userPaymentMethods.find(pm => pm.isDefault);
        if (defaultPaymentMethod) {
          setSelectedPaymentMethod(defaultPaymentMethod.id);
        } else if (userPaymentMethods.length === 0) {
          setShowAddPayment(true);
        }
      }
    } catch (error) {
      console.error("Failed to load upgrade data:", error);
      toast({
        title: "Error",
        description: "Failed to load upgrade information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!plan) return 0;
    
    // In a real app, this would calculate prorated charges
    return plan.price;
  };

  const handleUpgrade = async () => {
    if (!user || !plan || (!selectedPaymentMethod && paymentMethods.length > 0)) {
      toast({
        title: "Payment method required",
        description: "Please select a payment method to continue.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      // Create or update subscription
      if (currentSubscription) {
        await billingAPI.updateSubscription(currentSubscription.id, plan.id);
      } else {
        await billingAPI.createSubscription(user.id, plan.id, selectedPaymentMethod);
      }

      toast({
        title: "Upgrade successful!",
        description: `You've successfully upgraded to the ${plan.name} plan.`,
      });

      // Redirect to billing dashboard
      router.push('/billing');
    } catch (error) {
      toast({
        title: "Upgrade failed",
        description: "Failed to process upgrade. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAddPaymentMethod = async (paymentMethodData: any) => {
    if (!user) return;

    try {
      const newPaymentMethod = await billingAPI.addPaymentMethod(
        user.id,
        paymentMethodData.type,
        paymentMethodData
      );

      setPaymentMethods(prev => [...prev, newPaymentMethod]);
      setSelectedPaymentMethod(newPaymentMethod.id);
      setShowAddPayment(false);

      toast({
        title: "Payment method added",
        description: "Your payment method has been successfully added.",
      });
    } catch (error) {
      throw error; // Let the PaymentMethodForm handle the error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading upgrade details...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Plan not found</p>
          <Button onClick={() => router.push('/billing/plans')} className="mt-4">
            Back to Plans
          </Button>
        </div>
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>

            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Complete your upgrade</h1>
              <p className="text-muted-foreground">
                You're upgrading to the {plan.name} plan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {showAddPayment ? (
                <PaymentMethodForm
                  onSave={handleAddPaymentMethod}
                  onCancel={() => setShowAddPayment(false)}
                />
              ) : (
                <>
                  {/* Payment Methods */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Method
                      </CardTitle>
                      <CardDescription>
                        Select a payment method for your subscription
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {paymentMethods.length > 0 ? (
                        <div className="space-y-3">
                          {paymentMethods.map((method) => (
                            <div 
                              key={method.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedPaymentMethod === method.id 
                                  ? 'border-primary bg-primary/5' 
                                  : 'hover:border-muted-foreground'
                              }`}
                              onClick={() => setSelectedPaymentMethod(method.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <CreditCard className="h-5 w-5" />
                                  <div>
                                    <div className="font-medium">
                                      •••• •••• •••• {method.last4}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {method.brand?.toUpperCase()} • Expires {method.expiryMonth}/{method.expiryYear}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {method.isDefault && (
                                    <Badge variant="outline">Default</Badge>
                                  )}
                                  <div className={`w-4 h-4 rounded-full border-2 ${
                                    selectedPaymentMethod === method.id 
                                      ? 'border-primary bg-primary' 
                                      : 'border-muted-foreground'
                                  }`} />
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <Button 
                            variant="outline" 
                            onClick={() => setShowAddPayment(true)}
                            className="w-full"
                          >
                            Add New Payment Method
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="font-semibold mb-2">No payment methods</h3>
                          <p className="text-muted-foreground mb-4">
                            Add a payment method to complete your upgrade
                          </p>
                          <Button onClick={() => setShowAddPayment(true)}>
                            Add Payment Method
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Security Notice */}
                  <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <h4 className="font-medium text-green-900 dark:text-green-100">
                            Secure Payment Processing
                          </h4>
                          <p className="text-sm text-green-700 dark:text-green-200">
                            Your payment information is encrypted and secure. We never store your 
                            credit card details on our servers.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Plan Details */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {plan.name}
                          {plan.popular && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-red-500">
                              Popular
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {isYearly ? 'Yearly' : 'Monthly'} billing
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          ${plan.price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          /{plan.interval}
                        </div>
                      </div>
                    </div>

                    {isYearly && plan.interval === 'year' && (
                      <div className="text-sm text-green-600">
                        Save 20% with yearly billing
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Current Plan */}
                  {currentPlan && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Current Plan</div>
                      <div className="text-sm text-muted-foreground">
                        {currentPlan.name} - ${currentPlan.price}/{currentPlan.interval}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                    {currentPlan && (
                      <div className="text-sm text-muted-foreground">
                        Prorated for current billing period
                      </div>
                    )}
                  </div>

                  {/* Trial Notice */}
                  {!currentSubscription && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          14-day free trial
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                        You won't be charged until your trial ends. Cancel anytime.
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleUpgrade}
                    disabled={processing || (!selectedPaymentMethod && paymentMethods.length > 0) || showAddPayment}
                  >
                    {processing ? (
                      "Processing..."
                    ) : currentSubscription ? (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade to {plan.name}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Start Free Trial
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By clicking upgrade, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </CardContent>
              </Card>

              {/* Plan Features */}
              <Card>
                <CardHeader>
                  <CardTitle>What's included</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
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