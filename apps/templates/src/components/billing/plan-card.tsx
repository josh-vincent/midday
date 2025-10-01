"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { useToast } from "@midday/ui/use-toast";
import { Check, Star, Zap } from "lucide-react";
import { type MockPlan } from "@/lib/mock/billing-mock";

interface PlanCardProps {
  plan: MockPlan;
  currentPlanId?: string;
  isYearly?: boolean;
  onSelectPlan?: (planId: string) => Promise<void>;
  loading?: boolean;
}

export function PlanCard({ 
  plan, 
  currentPlanId, 
  isYearly = false, 
  onSelectPlan,
  loading = false 
}: PlanCardProps) {
  const [selecting, setSelecting] = useState(false);
  const { toast } = useToast();
  
  const isCurrentPlan = currentPlanId === plan.id;
  const isFree = plan.price === 0;
  
  // Calculate yearly savings
  const monthlySavings = isYearly && !isFree ? Math.round(plan.price * 0.2) : 0;

  const handleSelectPlan = async () => {
    if (isCurrentPlan || !onSelectPlan) return;
    
    setSelecting(true);
    try {
      await onSelectPlan(plan.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to select plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSelecting(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    return <Check className="h-4 w-4 text-green-500 flex-shrink-0" />;
  };

  const formatLimit = (value: number | string) => {
    if (value === 'unlimited') return 'Unlimited';
    if (typeof value === 'number') return value.toLocaleString();
    return value;
  };

  return (
    <Card className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1">
            <Star className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4">
          <Badge variant="success">
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-8">
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription className="min-h-[48px]">
          {plan.description}
        </CardDescription>
        
        <div className="space-y-2">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">${plan.price}</span>
            <span className="text-muted-foreground">
              /{isFree ? 'forever' : plan.interval}
            </span>
          </div>
          
          {isYearly && monthlySavings > 0 && (
            <div className="text-sm text-green-600">
              Save ${monthlySavings}/month
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Features */}
        <div className="space-y-3">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              {getFeatureIcon(feature)}
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Limits */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Plan Limits</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Team members:</span>
              <span className="font-medium">{formatLimit(plan.limits.users)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teams:</span>
              <span className="font-medium">{formatLimit(plan.limits.teams)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Storage:</span>
              <span className="font-medium">{plan.limits.storage}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API calls:</span>
              <span className="font-medium">{formatLimit(plan.limits.apiCalls)}/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Integrations:</span>
              <span className="font-medium">{formatLimit(plan.limits.integrations)}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          className="w-full"
          variant={plan.popular ? "default" : "outline"}
          onClick={handleSelectPlan}
          disabled={isCurrentPlan || loading || selecting}
        >
          {selecting ? (
            "Selecting..."
          ) : isCurrentPlan ? (
            "Current Plan"
          ) : isFree ? (
            "Get Started"
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              {`Upgrade to ${plan.name}`}
            </>
          )}
        </Button>

        {!isFree && (
          <p className="text-xs text-center text-muted-foreground">
            14-day free trial • Cancel anytime
          </p>
        )}
      </CardContent>
    </Card>
  );
}