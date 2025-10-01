"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Switch } from "@midday/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useToast } from "@midday/ui/use-toast";
import {
  Settings,
  Building2,
  FileText,
  CreditCard,
  Globe,
  Save,
  Upload
} from "lucide-react";

interface InvoiceSettingsData {
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    taxId: string;
    website: string;
    logo?: string;
  };
  defaults: {
    currency: string;
    paymentTerms: number;
    taxRate: number;
    vatRate: number;
    includeVat: boolean;
    includeTax: boolean;
    includeDiscount: boolean;
    includeDecimals: boolean;
    includeUnits: boolean;
    includeQr: boolean;
    includeItemDetails: boolean;
    groupConsolidatedItems: boolean;
    consolidatedItemLabel: string;
    autoGroupingRules: {
      enabled: boolean;
      groupByName: boolean;
      groupBelowPrice: number;
      groupSingleQuantity: boolean;
      groupByPattern: string[];
      autoHideDetails: boolean;
    };
    dateFormat: string;
    invoicePrefix: string;
    nextInvoiceNumber: number;
    locale: string;
    size: "a4" | "letter";
  };
  payment: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    swiftCode: string;
    iban: string;
    paypalEmail: string;
    venmoHandle: string;
    cryptoWallet: string;
    paymentInstructions: string;
  };
  templates: {
    invoiceNotes: string;
    termsAndConditions: string;
    emailSubject: string;
    emailMessage: string;
  };
}

export function InvoiceSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<InvoiceSettingsData>(() => {
    // Load from localStorage or use defaults
    const stored = localStorage.getItem("invoiceSettings");
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      company: {
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "United States",
        taxId: "",
        website: "",
      },
      defaults: {
        currency: "USD",
        paymentTerms: 30,
        taxRate: 10,
        vatRate: 0,
        includeVat: false,
        includeTax: true,
        includeDiscount: true,
        includeDecimals: true,
        includeUnits: false,
        includeQr: false,
        includeItemDetails: true,
        groupConsolidatedItems: false,
        consolidatedItemLabel: "Professional Services",
        autoGroupingRules: {
          enabled: false,
          groupByName: false,
          groupBelowPrice: 50,
          groupSingleQuantity: false,
          groupByPattern: [],
          autoHideDetails: true,
        },
        dateFormat: "MM/dd/yyyy",
        invoicePrefix: "INV-",
        nextInvoiceNumber: 1001,
        locale: "en-US",
        size: "letter",
      },
      payment: {
        bankName: "",
        accountNumber: "",
        routingNumber: "",
        swiftCode: "",
        iban: "",
        paypalEmail: "",
        venmoHandle: "",
        cryptoWallet: "",
        paymentInstructions: "Payment due within specified terms. Late payments may incur additional fees.",
      },
      templates: {
        invoiceNotes: "Thank you for your business!",
        termsAndConditions: "All sales are final. Returns accepted within 30 days with receipt.",
        emailSubject: "Invoice {{invoiceNumber}} from {{companyName}}",
        emailMessage: "Please find attached invoice {{invoiceNumber}} for {{amount}}. Payment is due by {{dueDate}}.",
      },
    };
  });

  const handleSave = () => {
    localStorage.setItem("invoiceSettings", JSON.stringify(settings));
    toast({
      title: "Settings saved",
      description: "Your invoice settings have been saved successfully",
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({
          ...settings,
          company: { ...settings.company, logo: reader.result as string },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company" className="text-xs sm:text-sm">
            <Building2 className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="defaults" className="text-xs sm:text-sm">
            <Settings className="h-4 w-4 mr-2" />
            Defaults
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-xs sm:text-sm">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Your company details that will appear on invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.company.name}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, name: e.target.value },
                      })
                    }
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input
                    id="taxId"
                    value={settings.company.taxId}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, taxId: e.target.value },
                      })
                    }
                    placeholder="12-3456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.company.email}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, email: e.target.value },
                      })
                    }
                    placeholder="billing@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={settings.company.phone}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, phone: e.target.value },
                      })
                    }
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={settings.company.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      company: { ...settings.company, address: e.target.value },
                    })
                  }
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.company.city}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, city: e.target.value },
                      })
                    }
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={settings.company.state}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, state: e.target.value },
                      })
                    }
                    placeholder="NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP/Postal Code</Label>
                  <Input
                    id="zip"
                    value={settings.company.zip}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        company: { ...settings.company, zip: e.target.value },
                      })
                    }
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Company Logo</Label>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </Button>
                  {settings.company.logo && (
                    <img
                      src={settings.company.logo}
                      alt="Company Logo"
                      className="h-10 w-auto"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Settings</CardTitle>
              <CardDescription>
                Default values for new invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.defaults.currency}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, currency: value },
                      })
                    }
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                  <Input
                    id="paymentTerms"
                    type="number"
                    value={settings.defaults.paymentTerms}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaults: {
                          ...settings.defaults,
                          paymentTerms: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={settings.defaults.taxRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaults: {
                          ...settings.defaults,
                          taxRate: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    step="0.01"
                    value={settings.defaults.vatRate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaults: {
                          ...settings.defaults,
                          vatRate: parseFloat(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={settings.defaults.invoicePrefix}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaults: {
                          ...settings.defaults,
                          invoicePrefix: e.target.value,
                        },
                      })
                    }
                    placeholder="INV-"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nextNumber">Next Invoice Number</Label>
                  <Input
                    id="nextNumber"
                    type="number"
                    value={settings.defaults.nextInvoiceNumber}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaults: {
                          ...settings.defaults,
                          nextInvoiceNumber: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="includeTax">Include Tax</Label>
                  <Switch
                    id="includeTax"
                    checked={settings.defaults.includeTax}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, includeTax: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="includeVat">Include VAT</Label>
                  <Switch
                    id="includeVat"
                    checked={settings.defaults.includeVat}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, includeVat: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="includeDiscount">Include Discount</Label>
                  <Switch
                    id="includeDiscount"
                    checked={settings.defaults.includeDiscount}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, includeDiscount: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="includeQr">Include QR Code</Label>
                  <Switch
                    id="includeQr"
                    checked={settings.defaults.includeQr}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, includeQr: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="includeItemDetails">Show Item Details</Label>
                  <Switch
                    id="includeItemDetails"
                    checked={settings.defaults.includeItemDetails}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, includeItemDetails: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="groupConsolidatedItems">Group Consolidated Items</Label>
                  <Switch
                    id="groupConsolidatedItems"
                    checked={settings.defaults.groupConsolidatedItems}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        defaults: { ...settings.defaults, groupConsolidatedItems: checked },
                      })
                    }
                  />
                </div>

                {settings.defaults.groupConsolidatedItems && (
                  <div className="space-y-2">
                    <Label htmlFor="consolidatedItemLabel">Consolidated Item Label</Label>
                    <Input
                      id="consolidatedItemLabel"
                      value={settings.defaults.consolidatedItemLabel}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaults: {
                            ...settings.defaults,
                            consolidatedItemLabel: e.target.value,
                          },
                        })
                      }
                      placeholder="Professional Services"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Grouping Rules</CardTitle>
              <CardDescription>
                Automatically group and consolidate items based on rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoGroupingEnabled">Enable Auto-Grouping</Label>
                <Switch
                  id="autoGroupingEnabled"
                  checked={settings.defaults.autoGroupingRules.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      defaults: {
                        ...settings.defaults,
                        autoGroupingRules: {
                          ...settings.defaults.autoGroupingRules,
                          enabled: checked,
                        },
                      },
                    })
                  }
                />
              </div>

              {settings.defaults.autoGroupingRules.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-muted">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="groupByName">Group items with same name</Label>
                    <Switch
                      id="groupByName"
                      checked={settings.defaults.autoGroupingRules.groupByName}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          defaults: {
                            ...settings.defaults,
                            autoGroupingRules: {
                              ...settings.defaults.autoGroupingRules,
                              groupByName: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="groupSingleQuantity">Group single quantity items</Label>
                    <Switch
                      id="groupSingleQuantity"
                      checked={settings.defaults.autoGroupingRules.groupSingleQuantity}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          defaults: {
                            ...settings.defaults,
                            autoGroupingRules: {
                              ...settings.defaults.autoGroupingRules,
                              groupSingleQuantity: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupBelowPrice">Group items below price</Label>
                    <Input
                      id="groupBelowPrice"
                      type="number"
                      value={settings.defaults.autoGroupingRules.groupBelowPrice}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaults: {
                            ...settings.defaults,
                            autoGroupingRules: {
                              ...settings.defaults.autoGroupingRules,
                              groupBelowPrice: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      placeholder="50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupByPattern">Group by patterns (comma-separated)</Label>
                    <Input
                      id="groupByPattern"
                      value={settings.defaults.autoGroupingRules.groupByPattern.join(", ")}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          defaults: {
                            ...settings.defaults,
                            autoGroupingRules: {
                              ...settings.defaults.autoGroupingRules,
                              groupByPattern: e.target.value
                                .split(",")
                                .map(s => s.trim())
                                .filter(s => s),
                            },
                          },
                        })
                      }
                      placeholder="consulting, admin, support"
                    />
                    <p className="text-xs text-muted-foreground">
                      Items containing these words will be grouped
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoHideDetails">Auto-hide quantity/price for grouped</Label>
                    <Switch
                      id="autoHideDetails"
                      checked={settings.defaults.autoGroupingRules.autoHideDetails}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          defaults: {
                            ...settings.defaults,
                            autoGroupingRules: {
                              ...settings.defaults.autoGroupingRules,
                              autoHideDetails: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>
                Payment methods and instructions for your invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={settings.payment.bankName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: { ...settings.payment, bankName: e.target.value },
                      })
                    }
                    placeholder="Chase Bank"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={settings.payment.accountNumber}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          accountNumber: e.target.value,
                        },
                      })
                    }
                    placeholder="****1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={settings.payment.routingNumber}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: {
                          ...settings.payment,
                          routingNumber: e.target.value,
                        },
                      })
                    }
                    placeholder="123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="swiftCode">SWIFT Code</Label>
                  <Input
                    id="swiftCode"
                    value={settings.payment.swiftCode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        payment: { ...settings.payment, swiftCode: e.target.value },
                      })
                    }
                    placeholder="CHASUS33"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paypalEmail">PayPal Email</Label>
                <Input
                  id="paypalEmail"
                  type="email"
                  value={settings.payment.paypalEmail}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, paypalEmail: e.target.value },
                    })
                  }
                  placeholder="payments@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentInstructions">Payment Instructions</Label>
                <Textarea
                  id="paymentInstructions"
                  value={settings.payment.paymentInstructions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: {
                        ...settings.payment,
                        paymentInstructions: e.target.value,
                      },
                    })
                  }
                  placeholder="Please include invoice number in payment reference..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email & Note Templates</CardTitle>
              <CardDescription>
                Default text for invoices and email messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNotes">Default Invoice Notes</Label>
                <Textarea
                  id="invoiceNotes"
                  value={settings.templates.invoiceNotes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      templates: {
                        ...settings.templates,
                        invoiceNotes: e.target.value,
                      },
                    })
                  }
                  placeholder="Thank you for your business!"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={settings.templates.termsAndConditions}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      templates: {
                        ...settings.templates,
                        termsAndConditions: e.target.value,
                      },
                    })
                  }
                  placeholder="All sales are final..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailSubject">Email Subject Template</Label>
                <Input
                  id="emailSubject"
                  value={settings.templates.emailSubject}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      templates: {
                        ...settings.templates,
                        emailSubject: e.target.value,
                      },
                    })
                  }
                  placeholder="Invoice {{invoiceNumber}} from {{companyName}}"
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {"{{invoiceNumber}}, {{companyName}}, {{amount}}, {{dueDate}}"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailMessage">Email Message Template</Label>
                <Textarea
                  id="emailMessage"
                  value={settings.templates.emailMessage}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      templates: {
                        ...settings.templates,
                        emailMessage: e.target.value,
                      },
                    })
                  }
                  placeholder="Please find attached invoice..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Variables: {"{{invoiceNumber}}, {{companyName}}, {{amount}}, {{dueDate}}, {{customerName}}"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}