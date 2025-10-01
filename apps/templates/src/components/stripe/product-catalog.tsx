"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Skeleton } from "@midday/ui/skeleton";
import { useToast } from "@midday/ui/use-toast";
import { Package, Check, Zap, ShoppingCart } from "lucide-react";
import { stripeAPI, type MockProduct } from "@/lib/mock/stripe-mock";

export function ProductCatalog() {
  const [products, setProducts] = useState<MockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await stripeAPI.getProducts();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Error loading products",
        description: "Failed to fetch product data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCheckout = async (priceId: string, productName: string) => {
    try {
      const { url } = await stripeAPI.createCheckoutSession(priceId);
      toast({
        title: "Checkout Session Created",
        description: `Checkout URL for ${productName}: ${url}`,
      });
      // In production: window.open(url, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create checkout session",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getFeatures = (productName: string): string[] => {
    const features: Record<string, string[]> = {
      "Starter Plan": [
        "Up to 10 users",
        "Basic analytics",
        "Email support",
        "API access",
      ],
      "Pro Plan": [
        "Unlimited users",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
        "Team collaboration",
      ],
      "Enterprise Plan": [
        "Unlimited everything",
        "Custom analytics",
        "Dedicated support",
        "SLA guarantee",
        "Custom development",
        "Training sessions",
      ],
      "Add-on Storage": [
        "100GB additional storage",
        "Automatic backups",
        "Version history",
      ],
      "API Access": [
        "Unlimited API calls",
        "Priority rate limits",
        "Webhook support",
        "Custom endpoints",
      ],
    };

    return features[productName] || ["Standard features"];
  };

  const popularProducts = ["Pro Plan", "Enterprise Plan"];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Product Catalog</h2>
        <p className="text-muted-foreground">
          Choose the perfect plan for your business
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const isPopular = popularProducts.includes(product.name);
          const monthlyPrice = product.prices.find(p => p.interval === "month");
          const yearlyPrice = product.prices.find(p => p.interval === "year");

          return (
            <Card key={product.id} className={isPopular ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>{product.name}</span>
                    </CardTitle>
                    {isPopular && (
                      <Badge variant="default" className="mt-2">
                        <Zap className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {product.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="space-y-2">
                  {monthlyPrice && (
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold">
                        {formatCurrency(monthlyPrice.amount)}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  )}
                  {yearlyPrice && (
                    <div className="flex items-baseline space-x-2 text-sm">
                      <span className="font-semibold">
                        {formatCurrency(yearlyPrice.amount)}
                      </span>
                      <span className="text-muted-foreground">/year</span>
                      <Badge variant="secondary" className="ml-2">
                        Save {Math.round((1 - (yearlyPrice.amount / (monthlyPrice?.amount || 1) / 12)) * 100)}%
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {getFeatures(product.name).map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="space-y-2 flex-col">
                {monthlyPrice && (
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    onClick={() => handleCreateCheckout(monthlyPrice.id, product.name)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Start Monthly
                  </Button>
                )}
                {yearlyPrice && (
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateCheckout(yearlyPrice.id, `${product.name} (Annual)`)}
                  >
                    Start Annual Plan
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}