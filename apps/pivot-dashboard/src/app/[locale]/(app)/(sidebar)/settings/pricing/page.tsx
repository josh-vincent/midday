import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { PricingSettings } from "@/components/pricing/pricing-settings";

export default function PricingSettingsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Pricing Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure default pricing for materials and equipment, and set customer-specific overrides.
        </p>
      </div>

      <PricingSettings />
    </div>
  );
}