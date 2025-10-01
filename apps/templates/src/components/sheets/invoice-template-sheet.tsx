"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Label } from "@midday/ui/label";
import { RadioGroup, RadioGroupItem } from "@midday/ui/radio-group";
import { Badge } from "@midday/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import { Textarea } from "@midday/ui/textarea";
import { Switch } from "@midday/ui/switch";
import { 
  FileText, 
  Palette, 
  Layout,
  Download,
  Eye,
  Settings,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockInvoice } from "@/lib/mock/invoices-mock";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: MockInvoice;
  onTemplateChange?: (template: string, customizations?: any) => void;
  onSave?: (templateData: any) => void;
};

const templates = [
  {
    id: "standard",
    name: "Standard",
    description: "Clean and professional design suitable for all businesses",
    preview: "/templates/standard-preview.png",
    features: ["Header with logo", "Customer details", "Itemized billing", "Payment terms"]
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary design with bold typography and clean lines",
    preview: "/templates/modern-preview.png",
    features: ["Minimalist header", "Color accents", "Grid layout", "Payment QR code"]
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and elegant design focusing on essential information",
    preview: "/templates/minimal-preview.png",
    features: ["Text-only header", "Simple layout", "Compact design", "Essential details only"]
  }
];

const colorThemes = [
  { id: "blue", name: "Blue", primary: "#3B82F6", secondary: "#EFF6FF" },
  { id: "green", name: "Green", primary: "#10B981", secondary: "#ECFDF5" },
  { id: "purple", name: "Purple", primary: "#8B5CF6", secondary: "#F3E8FF" },
  { id: "orange", name: "Orange", primary: "#F59E0B", secondary: "#FFF7ED" },
  { id: "red", name: "Red", primary: "#EF4444", secondary: "#FEF2F2" },
  { id: "gray", name: "Gray", primary: "#6B7280", secondary: "#F9FAFB" },
];

export function InvoiceTemplateSheet({ 
  open, 
  onOpenChange, 
  invoice,
  onTemplateChange,
  onSave 
}: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState(invoice?.template || "standard");
  const [customizations, setCustomizations] = useState({
    colorTheme: "blue",
    showLogo: true,
    companyName: "Your Company",
    tagline: "",
    footerText: "Thank you for your business!",
    includePaymentTerms: true,
    includeNotes: true,
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "INV-{number}",
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    onTemplateChange?.(templateId, customizations);
  };

  const handleCustomizationChange = (key: string, value: any) => {
    const newCustomizations = { ...customizations, [key]: value };
    setCustomizations(newCustomizations);
    onTemplateChange?.(selectedTemplate, newCustomizations);
  };

  const handleSave = () => {
    onSave?.({
      template: selectedTemplate,
      customizations,
    });
    onOpenChange(false);
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Invoice Template</SheetTitle>
          <SheetDescription>
            Choose and customize your invoice template
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Template Selection */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Layout className="h-4 w-4" />
              <Label className="text-base font-medium">Choose Template</Label>
            </div>
            
            <RadioGroup 
              value={selectedTemplate} 
              onValueChange={handleTemplateSelect}
              className="grid grid-cols-1 gap-4"
            >
              {templates.map((template) => (
                <div key={template.id} className="flex items-center space-x-3">
                  <RadioGroupItem value={template.id} id={template.id} />
                  <Card className={cn(
                    "flex-1 cursor-pointer transition-colors",
                    selectedTemplate === template.id && "ring-2 ring-primary"
                  )} onClick={() => handleTemplateSelect(template.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {template.description}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Customization Options */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <Label className="text-base font-medium">Customization</Label>
            </div>

            {/* Color Theme */}
            <div className="space-y-3">
              <Label className="text-sm">Color Theme</Label>
              <div className="grid grid-cols-6 gap-2">
                {colorThemes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    className={cn(
                      "p-3 rounded-lg border-2 transition-colors",
                      customizations.colorTheme === theme.id 
                        ? "border-primary" 
                        : "border-border hover:border-muted-foreground"
                    )}
                    onClick={() => handleCustomizationChange("colorTheme", theme.id)}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="text-xs">{theme.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Company Details */}
            <div className="space-y-4">
              <Label className="text-sm">Company Information</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-xs">Company Name</Label>
                  <Input
                    id="companyName"
                    value={customizations.companyName}
                    onChange={(e) => handleCustomizationChange("companyName", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tagline" className="text-xs">Tagline (Optional)</Label>
                  <Input
                    id="tagline"
                    placeholder="Your business tagline"
                    value={customizations.tagline}
                    onChange={(e) => handleCustomizationChange("tagline", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showLogo" className="flex flex-col space-y-1">
                  <span className="text-xs">Show Company Logo</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    Display your logo on the invoice
                  </span>
                </Label>
                <Switch
                  id="showLogo"
                  checked={customizations.showLogo}
                  onCheckedChange={(checked) => handleCustomizationChange("showLogo", checked)}
                />
              </div>

              {customizations.showLogo && (
                <div className="space-y-2">
                  <Label className="text-xs">Logo Upload</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                    <div className="flex flex-col items-center space-y-2 text-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </div>
                      <div className="text-xs text-muted-foreground">
                        PNG, JPG, GIF up to 2MB
                      </div>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Format Settings */}
            <div className="space-y-4">
              <Label className="text-sm">Format Settings</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-xs">Currency</Label>
                  <Input
                    id="currency"
                    value={customizations.currency}
                    onChange={(e) => handleCustomizationChange("currency", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateFormat" className="text-xs">Date Format</Label>
                  <Input
                    id="dateFormat"
                    value={customizations.dateFormat}
                    onChange={(e) => handleCustomizationChange("dateFormat", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numberFormat" className="text-xs">Invoice Number Format</Label>
                <Input
                  id="numberFormat"
                  value={customizations.numberFormat}
                  onChange={(e) => handleCustomizationChange("numberFormat", e.target.value)}
                  placeholder="INV-{number}"
                />
              </div>
            </div>

            {/* Content Options */}
            <div className="space-y-4">
              <Label className="text-sm">Content Options</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="includePaymentTerms" className="text-xs">
                    Include Payment Terms
                  </Label>
                  <Switch
                    id="includePaymentTerms"
                    checked={customizations.includePaymentTerms}
                    onCheckedChange={(checked) => handleCustomizationChange("includePaymentTerms", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="includeNotes" className="text-xs">
                    Include Notes Section
                  </Label>
                  <Switch
                    id="includeNotes"
                    checked={customizations.includeNotes}
                    onCheckedChange={(checked) => handleCustomizationChange("includeNotes", checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText" className="text-xs">Footer Text</Label>
                <Textarea
                  id="footerText"
                  rows={2}
                  value={customizations.footerText}
                  onChange={(e) => handleCustomizationChange("footerText", e.target.value)}
                  placeholder="Thank you message or additional information"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {selectedTemplateData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Preview</Label>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Full Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample
                  </Button>
                </div>
              </div>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Preview of {selectedTemplateData.name} template</p>
                    <p className="text-xs">Click "Full Preview" to see complete invoice</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Advanced
              </Button>
              <Button onClick={handleSave}>
                Save Template
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}