"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Button } from "@midday/ui/button";
import { Switch } from "@midday/ui/switch";
import { Label } from "@midday/ui/label";
import { Input } from "@midday/ui/input";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { HtmlTemplate } from "@midday/invoice";
import type { Invoice } from "@midday/invoice";
import { 
  FileText, 
  Eye, 
  EyeOff, 
  Package,
  DollarSign,
  Settings,
  Copy,
  Code,
  CheckCircle2
} from "lucide-react";

// Sample invoice data with mixed itemization
const createSampleInvoice = (
  includeItemDetails: boolean,
  groupConsolidatedItems: boolean,
  consolidatedItemLabel: string
): Invoice => ({
  id: "inv-001",
  invoiceNumber: "INV-2024-001",
  issueDate: new Date().toISOString(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  amount: 5225,
  currency: "USD",
  status: "unpaid",
  token: "demo-token",
  subtotal: 5225,
  customerName: "Acme Corporation",
  customer: {
    name: "Acme Corporation",
    email: "billing@acme.com",
    website: "https://acme.com"
  },
  team: {
    name: "Your Company"
  },
  lineItems: [
    {
      name: "UI/UX Design - Homepage Redesign",
      quantity: 40,
      price: 75,
      unit: "hour",
      showDetails: true // Always show details for this item
    },
    {
      name: "Research & Planning",
      quantity: 8,
      price: 50,
      showDetails: false, // Hide details, will be consolidated
      groupId: "consulting"
    },
    {
      name: "Stakeholder Interviews",
      quantity: 5,
      price: 60,
      showDetails: false, // Hide details, will be consolidated
      groupId: "consulting"
    },
    {
      name: "Documentation & Reports",
      quantity: 3,
      price: 45,
      showDetails: false, // Hide details, will be consolidated
      groupId: "consulting"
    },
    {
      name: "Frontend Development",
      quantity: 20,
      price: 85,
      unit: "hour",
      showDetails: true // Always show details for this item
    },
    {
      name: "Miscellaneous Expenses",
      quantity: 1,
      price: 125,
      showDetails: false, // Hide details, standalone
      groupId: "expenses"
    },
    {
      name: "Travel Costs",
      quantity: 1,
      price: 165,
      showDetails: false, // Hide details, standalone
      groupId: "expenses"
    }
  ],
  template: {
    customerLabel: "Bill To",
    title: "INVOICE",
    fromLabel: "From",
    invoiceNoLabel: "Invoice No",
    issueDateLabel: "Issue Date",
    dueDateLabel: "Due Date",
    descriptionLabel: "Description",
    priceLabel: "Rate",
    quantityLabel: "Qty",
    totalLabel: "Total",
    totalSummaryLabel: "Total Due",
    vatLabel: "VAT",
    subtotalLabel: "Subtotal",
    taxLabel: "Tax",
    discountLabel: "Discount",
    timezone: "America/New_York",
    paymentLabel: "Payment Details",
    noteLabel: "Notes",
    logoUrl: null,
    currency: "USD",
    paymentDetails: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Bank: Example Bank" }] },
        { type: "paragraph", content: [{ type: "text", text: "Account: 1234567890" }] },
        { type: "paragraph", content: [{ type: "text", text: "Routing: 987654321" }] }
      ]
    },
    fromDetails: {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Your Company Inc." }] },
        { type: "paragraph", content: [{ type: "text", text: "123 Business St" }] },
        { type: "paragraph", content: [{ type: "text", text: "New York, NY 10001" }] },
        { type: "paragraph", content: [{ type: "text", text: "contact@yourcompany.com" }] }
      ]
    },
    dateFormat: "MMM dd, yyyy",
    includeVat: false,
    includeTax: false,
    includeDiscount: false,
    includeDecimals: true,
    includeUnits: true,
    includeQr: false,
    includeItemDetails,
    groupConsolidatedItems,
    consolidatedItemLabel,
    taxRate: 0,
    vatRate: 0,
    size: "a4",
    deliveryType: "create",
    locale: "en-US"
  },
  customerDetails: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Acme Corporation" }] },
      { type: "paragraph", content: [{ type: "text", text: "456 Client Ave" }] },
      { type: "paragraph", content: [{ type: "text", text: "San Francisco, CA 94102" }] },
      { type: "paragraph", content: [{ type: "text", text: "billing@acme.com" }] }
    ]
  },
  fromDetails: null,
  paymentDetails: null,
  noteDetails: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Thank you for your business!" }] }
    ]
  },
  reminderSentAt: null,
  updatedAt: null,
  note: null,
  internalNote: null,
  paidAt: null,
  vat: null,
  tax: null,
  filePath: null,
  viewedAt: null,
  sentAt: null,
  sentTo: null,
  discount: null,
  customerId: null,
  topBlock: null,
  bottomBlock: null
});

export default function ItemizationPage() {
  const [includeItemDetails, setIncludeItemDetails] = useState(true);
  const [groupConsolidatedItems, setGroupConsolidatedItems] = useState(false);
  const [consolidatedItemLabel, setConsolidatedItemLabel] = useState("Professional Services");
  const [showCode, setShowCode] = useState(false);

  const invoice = createSampleInvoice(
    includeItemDetails,
    groupConsolidatedItems,
    consolidatedItemLabel
  );

  const codeExample = `// Configure invoice itemization
const invoice = {
  lineItems: [
    {
      name: "UI/UX Design",
      quantity: 40,
      price: 75,
      showDetails: true // Show full details
    },
    {
      name: "Research",
      quantity: 8,
      price: 50,
      showDetails: false, // Hide details
      groupId: "consulting" // Group with others
    },
    {
      name: "Documentation",
      quantity: 3,
      price: 45,
      showDetails: false,
      groupId: "consulting"
    }
  ],
  template: {
    // Control overall display
    includeItemDetails: ${includeItemDetails},
    groupConsolidatedItems: ${groupConsolidatedItems},
    consolidatedItemLabel: "${consolidatedItemLabel}"
  }
};`;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Invoice Itemization Control</h1>
        <p className="text-muted-foreground">
          Control how line items are displayed on invoices - show full details or consolidated summaries
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Itemization Settings
          </CardTitle>
          <CardDescription>
            Configure how invoice line items are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="item-details" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Show Item Details
              </Label>
              <p className="text-sm text-muted-foreground">
                Display quantity and price columns for detailed items
              </p>
            </div>
            <Switch
              id="item-details"
              checked={includeItemDetails}
              onCheckedChange={setIncludeItemDetails}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="group-items" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Group Consolidated Items
              </Label>
              <p className="text-sm text-muted-foreground">
                Combine items marked for consolidation into summary lines
              </p>
            </div>
            <Switch
              id="group-items"
              checked={groupConsolidatedItems}
              onCheckedChange={setGroupConsolidatedItems}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="consolidated-label" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Consolidated Item Label
            </Label>
            <Input
              id="consolidated-label"
              value={consolidatedItemLabel}
              onChange={(e) => setConsolidatedItemLabel(e.target.value)}
              placeholder="e.g., Professional Services"
            />
            <p className="text-sm text-muted-foreground">
              Label used for grouped consolidated items
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview Tabs */}
      <Tabs defaultValue="preview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="explanation">How It Works</TabsTrigger>
          <TabsTrigger value="code">Code Example</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
              <CardDescription>
                See how different itemization settings affect the invoice display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <HtmlTemplate
                  data={invoice}
                  width={800}
                  height={1000}
                />
              </div>
            </CardContent>
          </Card>

          {/* Item Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items Breakdown</CardTitle>
              <CardDescription>
                Understanding how items are processed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4 text-green-500" />
                    Detailed Items (Always Shown)
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span>UI/UX Design - Homepage Redesign</span>
                      <Badge variant="secondary">40 hrs × $75 = $3,000</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span>Frontend Development</span>
                      <Badge variant="secondary">20 hrs × $85 = $1,700</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-orange-500" />
                    Consolidated Items (Can be Grouped)
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span>Research & Planning</span>
                      <Badge variant="outline">Group: consulting - $400</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span>Stakeholder Interviews</span>
                      <Badge variant="outline">Group: consulting - $300</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span>Documentation & Reports</span>
                      <Badge variant="outline">Group: consulting - $135</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span>Miscellaneous Expenses</span>
                      <Badge variant="outline">Group: expenses - $125</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <span>Travel Costs</span>
                      <Badge variant="outline">Group: expenses - $165</Badge>
                    </div>
                  </div>
                </div>

                {groupConsolidatedItems && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      With Grouping Enabled:
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>• {consolidatedItemLabel} (consulting)</span>
                        <span className="font-medium">$835</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• {consolidatedItemLabel} (expenses)</span>
                        <span className="font-medium">$290</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explanation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How Itemization Control Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Key Concepts</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Individual Item Control</p>
                      <p className="text-sm text-muted-foreground">
                        Each line item can have `showDetails: false` to hide its quantity and price
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Group Consolidation</p>
                      <p className="text-sm text-muted-foreground">
                        Items with the same `groupId` can be combined into a single summary line
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Template Settings</p>
                      <p className="text-sm text-muted-foreground">
                        Global controls for display behavior across all items
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Configuration Options</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm font-mono">includeItemDetails</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      Controls whether quantity and price columns are shown at all
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm font-mono">groupConsolidatedItems</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      When true, items with `showDetails: false` are grouped by their `groupId`
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <code className="text-sm font-mono">consolidatedItemLabel</code>
                    <p className="text-sm text-muted-foreground mt-1">
                      The label used for grouped consolidated items
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Use Cases</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <DollarSign className="h-5 w-5 text-blue-500 mb-2" />
                    <h4 className="font-medium mb-1">Professional Services</h4>
                    <p className="text-sm text-muted-foreground">
                      Show detailed breakdown for billable hours, consolidate admin tasks
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Package className="h-5 w-5 text-green-500 mb-2" />
                    <h4 className="font-medium mb-1">Product Sales</h4>
                    <p className="text-sm text-muted-foreground">
                      Itemize main products, group shipping and handling fees
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <FileText className="h-5 w-5 text-purple-500 mb-2" />
                    <h4 className="font-medium mb-1">Consulting</h4>
                    <p className="text-sm text-muted-foreground">
                      Detail deliverables, summarize expenses and travel
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <Settings className="h-5 w-5 text-orange-500 mb-2" />
                    <h4 className="font-medium mb-1">Maintenance</h4>
                    <p className="text-sm text-muted-foreground">
                      Show main service items, consolidate minor repairs
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Implementation Example
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(codeExample);
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                <code className="text-sm">{codeExample}</code>
              </pre>

              <div className="mt-6 space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Full TypeScript Example</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`import { Invoice, LineItem } from "@midday/invoice";

// Define line items with itemization control
const lineItems: LineItem[] = [
  // Detailed items - always show quantity and price
  {
    name: "Website Design",
    quantity: 40,
    price: 150,
    unit: "hour",
    showDetails: true
  },
  
  // Consolidated items - will be grouped
  {
    name: "Initial Consultation",
    quantity: 2,
    price: 100,
    showDetails: false,
    groupId: "consulting"
  },
  {
    name: "Requirements Gathering",
    quantity: 5,
    price: 80,
    showDetails: false,
    groupId: "consulting"
  },
  
  // Standalone consolidated item
  {
    name: "Project Management",
    quantity: 10,
    price: 50,
    showDetails: false,
    groupId: "admin"
  }
];

// Configure template settings
const template = {
  // ... other template settings
  
  // Show/hide quantity and price columns
  includeItemDetails: true,
  
  // Group items with showDetails: false
  groupConsolidatedItems: true,
  
  // Label for consolidated groups
  consolidatedItemLabel: "Professional Services"
};

// Result on invoice:
// ✓ Website Design: 40 hrs × $150/hr = $6,000
// ✓ Professional Services (consulting): $600
// ✓ Professional Services (admin): $500`}</code>
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Advanced Grouping</h4>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`// Different groups with custom labels
const processLineItems = (items: LineItem[]) => {
  const groups = {
    consulting: "Consulting Services",
    expenses: "Reimbursable Expenses",
    admin: "Administrative Fees"
  };
  
  return items.map(item => ({
    ...item,
    // Assign group based on item type
    groupId: determineGroup(item),
    // Control detail display
    showDetails: shouldShowDetails(item)
  }));
};`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}