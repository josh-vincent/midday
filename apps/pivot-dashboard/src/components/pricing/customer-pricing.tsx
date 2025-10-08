"use client";

import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Textarea } from "@midday/ui/textarea";
import { useToast } from "@midday/ui/use-toast";
import { Badge } from "@midday/ui/badge";
import { Plus, Trash2, Save, DollarSign, AlertCircle } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const MATERIAL_TYPES = [
  "Dry Clean Fill",
  "Wet Fill", 
  "Rock",
  "Sand",
  "Topsoil",
  "Clay", 
  "Mixed Waste",
  "Other",
] as const;

interface CustomerMaterialPricing {
  id?: string;
  materialType: string;
  customPrice: number;
  currency: string;
  notes?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
}

interface CustomerPricingProps {
  customerId: string;
  customerName: string;
}

export function CustomerPricing({ customerId, customerName }: CustomerPricingProps) {
  const { toast } = useToast();
  
  // Sample data - replace with real API call
  const [customerPricing, setCustomerPricing] = useState<CustomerMaterialPricing[]>([
    {
      id: "1",
      materialType: "Dry Clean Fill",
      customPrice: 90.00,
      currency: "AUD",
      notes: "Premium rate for regular customer",
      effectiveFrom: new Date(),
      isActive: true,
    },
    {
      id: "2", 
      materialType: "Rock",
      customPrice: 100.00,
      currency: "AUD",
      effectiveFrom: new Date(),
      effectiveTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    },
  ]);

  const handlePricingChange = (index: number, field: keyof CustomerMaterialPricing, value: any) => {
    const updated = [...customerPricing];
    updated[index] = { ...updated[index], [field]: value };
    setCustomerPricing(updated);
  };

  const addCustomPricing = () => {
    setCustomerPricing([
      ...customerPricing,
      {
        materialType: "",
        customPrice: 0,
        currency: "AUD",
        effectiveFrom: new Date(),
        isActive: true,
      }
    ]);
  };

  const removeCustomPricing = (index: number) => {
    setCustomerPricing(customerPricing.filter((_, i) => i !== index));
  };

  const toggleActive = (index: number) => {
    handlePricingChange(index, 'isActive', !customerPricing[index].isActive);
  };

  const savePricing = async () => {
    try {
      // TODO: Implement API call to save customer pricing
      toast({
        title: "Customer pricing saved",
        description: `Pricing overrides for ${customerName} have been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customer pricing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDefaultPrice = (materialType: string) => {
    // TODO: Get from API or settings
    const defaults: Record<string, number> = {
      "Dry Clean Fill": 85.00,
      "Wet Fill": 75.00,
      "Rock": 95.00,
      "Sand": 80.00,
      "Topsoil": 90.00,
      "Clay": 70.00,
      "Mixed Waste": 110.00,
    };
    return defaults[materialType] || 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Customer-Specific Pricing
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Override default material pricing for {customerName}
            </p>
          </div>
          <Button onClick={addCustomPricing} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Override
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {customerPricing.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No custom pricing set for this customer</p>
            <p className="text-sm">Default material prices will be used</p>
          </div>
        ) : (
          customerPricing.map((pricing, index) => (
            <div key={index} className={`p-4 border rounded-lg space-y-4 ${!pricing.isActive ? 'opacity-60 bg-muted/30' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={pricing.isActive ? "default" : "secondary"}>
                    {pricing.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {pricing.effectiveTo && new Date(pricing.effectiveTo) < new Date() && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(index)}
                  >
                    {pricing.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeCustomPricing(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Material Type</Label>
                  <Select
                    value={pricing.materialType}
                    onValueChange={(value) => handlePricingChange(index, 'materialType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pricing.materialType && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: ${getDefaultPrice(pricing.materialType).toFixed(2)}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Custom Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={pricing.customPrice}
                    onChange={(e) => handlePricingChange(index, 'customPrice', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Currency</Label>
                  <Select
                    value={pricing.currency}
                    onValueChange={(value) => handlePricingChange(index, 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="NZD">NZD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Effective From</Label>
                  <Input
                    type="date"
                    value={format(pricing.effectiveFrom, 'yyyy-MM-dd')}
                    onChange={(e) => handlePricingChange(index, 'effectiveFrom', new Date(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Effective To (Optional)</Label>
                  <Input
                    type="date"
                    value={pricing.effectiveTo ? format(pricing.effectiveTo, 'yyyy-MM-dd') : ''}
                    onChange={(e) => handlePricingChange(index, 'effectiveTo', e.target.value ? new Date(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  value={pricing.notes || ''}
                  onChange={(e) => handlePricingChange(index, 'notes', e.target.value)}
                  placeholder="Add notes about this pricing override..."
                  rows={2}
                />
              </div>
            </div>
          ))
        )}

        {customerPricing.length > 0 && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={savePricing} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Customer Pricing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}