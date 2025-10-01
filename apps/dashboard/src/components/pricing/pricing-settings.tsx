"use client";

import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useToast } from "@midday/ui/use-toast";
import { Plus, Trash2, Save, DollarSign, Wrench } from "lucide-react";
import { useState } from "react";

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

const EQUIPMENT_TYPES = [
  "Truck & Trailer 22m3",
  "Truck & Quad 26m3",
  "Tandem 10m3", 
  "Single Truck",
  "Other",
] as const;

interface MaterialDefault {
  id?: string;
  materialType: string;
  defaultPrice: number;
  currency: string;
}

interface EquipmentDefault {
  id?: string;
  equipmentType: string;
  defaultCapacity: number;
}

export function PricingSettings() {
  const { toast } = useToast();
  
  // Material pricing defaults
  const [materialDefaults, setMaterialDefaults] = useState<MaterialDefault[]>([
    { materialType: "Dry Clean Fill", defaultPrice: 85.00, currency: "AUD" },
    { materialType: "Wet Fill", defaultPrice: 75.00, currency: "AUD" },
    { materialType: "Rock", defaultPrice: 95.00, currency: "AUD" },
    { materialType: "Sand", defaultPrice: 80.00, currency: "AUD" },
    { materialType: "Topsoil", defaultPrice: 90.00, currency: "AUD" },
    { materialType: "Clay", defaultPrice: 70.00, currency: "AUD" },
    { materialType: "Mixed Waste", defaultPrice: 110.00, currency: "AUD" },
  ]);

  // Equipment capacity defaults  
  const [equipmentDefaults, setEquipmentDefaults] = useState<EquipmentDefault[]>([
    { equipmentType: "Truck & Trailer 22m3", defaultCapacity: 22 },
    { equipmentType: "Truck & Quad 26m3", defaultCapacity: 26 },
    { equipmentType: "Tandem 10m3", defaultCapacity: 10 },
    { equipmentType: "Single Truck", defaultCapacity: 8 },
  ]);

  const handleMaterialPriceChange = (index: number, field: keyof MaterialDefault, value: string | number) => {
    const updated = [...materialDefaults];
    updated[index] = { ...updated[index], [field]: value };
    setMaterialDefaults(updated);
  };

  const handleEquipmentCapacityChange = (index: number, field: keyof EquipmentDefault, value: string | number) => {
    const updated = [...equipmentDefaults];
    updated[index] = { ...updated[index], [field]: value };
    setEquipmentDefaults(updated);
  };

  const addMaterialDefault = () => {
    setMaterialDefaults([
      ...materialDefaults,
      { materialType: "", defaultPrice: 0, currency: "AUD" }
    ]);
  };

  const removeMaterialDefault = (index: number) => {
    setMaterialDefaults(materialDefaults.filter((_, i) => i !== index));
  };

  const addEquipmentDefault = () => {
    setEquipmentDefaults([
      ...equipmentDefaults,
      { equipmentType: "", defaultCapacity: 0 }
    ]);
  };

  const removeEquipmentDefault = (index: number) => {
    setEquipmentDefaults(equipmentDefaults.filter((_, i) => i !== index));
  };

  const saveSettings = async () => {
    try {
      // TODO: Implement API calls to save settings
      toast({
        title: "Settings saved",
        description: "Pricing and equipment defaults have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Material Pricing
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Equipment Capacity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Material Pricing</CardTitle>
              <p className="text-sm text-muted-foreground">
                Set default prices per cubic metre for different material types. These will be used as fallbacks when creating jobs.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {materialDefaults.map((material, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Material Type</Label>
                    <Select
                      value={material.materialType}
                      onValueChange={(value) => handleMaterialPriceChange(index, 'materialType', value)}
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
                  </div>
                  
                  <div className="w-32">
                    <Label className="text-sm font-medium">Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={material.defaultPrice}
                      onChange={(e) => handleMaterialPriceChange(index, 'defaultPrice', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="w-20">
                    <Label className="text-sm font-medium">Currency</Label>
                    <Select
                      value={material.currency}
                      onValueChange={(value) => handleMaterialPriceChange(index, 'currency', value)}
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
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeMaterialDefault(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addMaterialDefault}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Material Type
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Equipment Capacity</CardTitle>
              <p className="text-sm text-muted-foreground">
                Set default cubic metre capacity for different equipment types. These will auto-fill when selecting equipment.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipmentDefaults.map((equipment, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Equipment Type</Label>
                    <Select
                      value={equipment.equipmentType}
                      onValueChange={(value) => handleEquipmentCapacityChange(index, 'equipmentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {EQUIPMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-32">
                    <Label className="text-sm font-medium">Capacity (m³)</Label>
                    <Input
                      type="number"
                      value={equipment.defaultCapacity}
                      onChange={(e) => handleEquipmentCapacityChange(index, 'defaultCapacity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeEquipmentDefault(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="outline"
                onClick={addEquipmentDefault}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment Type
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={saveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}