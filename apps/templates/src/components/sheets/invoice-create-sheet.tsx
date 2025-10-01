"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Switch } from "@midday/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { Calendar } from "@midday/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@midday/ui/popover";
import { cn } from "@midday/ui/cn";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Search, UserPlus, Eye, Settings2 } from "lucide-react";
import { Badge } from "@midday/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import type { MockCustomer, MockInvoiceItem } from "@/lib/mock/invoices-mock";
import { customersAPI } from "@/lib/mock/customers-mock";
import { HtmlTemplate } from "@midday/invoice/templates/html";
import { applyAutoItemizationRules } from "@midday/invoice/utils/auto-itemization";
import type { LineItem, Template } from "@midday/invoice/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@midday/ui/command";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: any) => void;
  customers?: MockCustomer[];
};

const paymentTermsOptions = [
  { value: "due_on_receipt", label: "Due on Receipt" },
  { value: "net15", label: "Net 15" },
  { value: "net30", label: "Net 30" },
  { value: "net60", label: "Net 60" },
];

const templateOptions = [
  { value: "standard", label: "Standard" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
];

export function InvoiceCreateSheet({ open, onOpenChange, onCreate, customers: propCustomers = [] }: Props) {
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [isRecurring, setIsRecurring] = useState(false);
  const [items, setItems] = useState<(Partial<MockInvoiceItem> & { showDetails?: boolean; groupId?: string })[]>([
    { description: "", quantity: 1, rate: 0, amount: 0, showDetails: true }
  ]);
  
  // Customer search state
  const [customers, setCustomers] = useState<MockCustomer[]>(propCustomers);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  
  // Invoice items search
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    customerId: "",
    paymentTerms: "net30",
    template: "standard",
    taxRate: 10,
    discount: 0,
    discountType: "fixed" as "fixed" | "percentage",
    notes: "",
    terms: "Payment is due within 30 days",
    recurringFrequency: "monthly" as "monthly" | "quarterly" | "yearly",
    // Auto-itemization settings
    includeItemDetails: true,
    groupConsolidatedItems: false,
    consolidatedItemLabel: "Professional Services",
    autoGroupingRules: {
      enabled: false,
      groupByName: false,
      groupBelowPrice: 50,
      groupSingleQuantity: false,
      groupByPattern: [] as string[],
      autoHideDetails: true,
    },
  });
  
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");

  // Load customers when component opens
  useEffect(() => {
    if (open && customers.length === 0) {
      loadCustomers();
    }
  }, [open]);

  const loadCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const customerData = await customersAPI.getCustomers();
      setCustomers(customerData);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName.trim()) return;
    
    try {
      const newCustomer = await customersAPI.createCustomer({
        name: newCustomerName,
        email: `${newCustomerName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        type: "business",
        status: "prospect"
      });
      
      setCustomers(prev => [newCustomer, ...prev]);
      setFormData({ ...formData, customerId: newCustomer.id });
      setNewCustomerName("");
      setShowCreateCustomer(false);
      setCustomerSearchOpen(false);
    } catch (error) {
      console.error("Failed to create customer:", error);
    }
  };

  const handlePreview = async () => {
    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) {
      alert("Please select a customer first");
      return;
    }

    try {
      // Generate a temporary token for preview
      const tempToken = `temp_${Date.now()}`;
      
      // Open preview using the token-based route
      const previewUrl = `/i/${tempToken}`;
      window.open(previewUrl, "_blank");
    } catch (error) {
      console.error("Preview error:", error);
      alert("Failed to generate preview");
    }
  };

  // Remove old preview code and close function here

  const unused_old_code = () => {
    // Old preview code removed - now using token-based preview
    const previewData = {
      customer,
      items,
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      issueDate,
      dueDate,
      formData
    };

    const previewWindow = window.open("", "_blank", "width=800,height=600");
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Invoice Preview</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 40px; }
              .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .customer-info { margin-bottom: 30px; }
              .items { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              .totals { text-align: right; }
              .total-row { font-weight: bold; font-size: 1.2em; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
            </div>
            <div class="invoice-info">
              <div>
                <strong>Issue Date:</strong> ${format(issueDate, "MMM dd, yyyy")}<br>
                <strong>Due Date:</strong> ${format(dueDate, "MMM dd, yyyy")}
              </div>
            </div>
            <div class="customer-info">
              <h3>Bill To:</h3>
              <strong>${customer.name}</strong><br>
              ${customer.email}<br>
              ${customer.phone ? customer.phone + "<br>" : ""}
            </div>
            <div class="items">
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>$${(item.rate || 0).toFixed(2)}</td>
                      <td>$${(item.amount || 0).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
            <div class="totals">
              <p>Subtotal: $${subtotal.toFixed(2)}</p>
              ${formData.discount > 0 ? `<p>Discount: -$${discountAmount.toFixed(2)}</p>` : ""}
              <p>Tax (${formData.taxRate}%): $${taxAmount.toFixed(2)}</p>
              <p class="total-row">Total: $${total.toFixed(2)}</p>
            </div>
            ${formData.notes ? `<div style="margin-top: 30px;"><strong>Notes:</strong><br>${formData.notes}</div>` : ""}
            ${formData.terms ? `<div style="margin-top: 20px;"><strong>Terms:</strong><br>${formData.terms}</div>` : ""}
          </body>
        </html>
      `);
      previewWindow.document.close();
    }
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  // Filter items based on search query  
  const filteredItems = itemSearchQuery
    ? items.map((item, index) => ({ ...item, originalIndex: index })).filter((item) =>
        item.description?.toLowerCase().includes(itemSearchQuery.toLowerCase())
      )
    : items.map((item, index) => ({ ...item, originalIndex: index }));

  const calculateItemAmount = (quantity: number, rate: number) => {
    return quantity * rate;
  };

  const updateItem = (index: number, field: keyof MockInvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "quantity" || field === "rate") {
      const quantity = field === "quantity" ? value : newItems[index].quantity || 0;
      const rate = field === "rate" ? value : newItems[index].rate || 0;
      newItems[index].amount = calculateItemAmount(quantity, rate);
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0, showDetails: true }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const discountAmount = formData.discountType === "percentage" 
    ? (subtotal * formData.discount / 100)
    : formData.discount;
  const taxAmount = (subtotal - discountAmount) * formData.taxRate / 100;
  const total = subtotal - discountAmount + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customer = customers.find(c => c.id === formData.customerId);
    if (!customer) return;

    const invoiceData = {
      ...formData,
      customer,
      date: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      items: items.map((item, index) => ({
        ...item,
        id: `item_${index + 1}`,
      })),
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
      amountPaid: 0,
      amountDue: total,
      status: "draft" as const,
      currency: "USD",
      recurring: isRecurring ? {
        frequency: formData.recurringFrequency,
        nextDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } : undefined,
    };

    onCreate(invoiceData);
    
    // Reset form
    setFormData({
      customerId: "",
      paymentTerms: "net30",
      template: "standard",
      taxRate: 10,
      discount: 0,
      discountType: "fixed",
      notes: "",
      terms: "Payment is due within 30 days",
      recurringFrequency: "monthly",
    });
    setItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
    setIssueDate(new Date());
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    setIsRecurring(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[700px] overflow-y-auto bg-white dark:bg-[#0C0C0C] transition-[max-width] duration-300 ease-in-out"
      >
        <SheetHeader>
          <SheetTitle>Create Invoice</SheetTitle>
          <SheetDescription>
            Create a new invoice for your customer
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer">Customer</Label>
            <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={customerSearchOpen}
                  className="w-full justify-between"
                >
                  {formData.customerId
                    ? customers.find((customer) => customer.id === formData.customerId)?.name || "Select customer"
                    : "Select customer..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onValueChange={setCustomerSearchQuery}
                  />
                  <CommandList>
                    {!showCreateCustomer ? (
                      <>
                        <CommandEmpty>
                          <div className="flex flex-col items-center gap-2 py-4">
                            <p className="text-sm text-muted-foreground">No customers found.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewCustomerName(customerSearchQuery);
                                setShowCreateCustomer(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <UserPlus className="h-4 w-4" />
                              Create Customer
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {filteredCustomers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.id}
                              onSelect={() => {
                                setFormData({ ...formData, customerId: customer.id });
                                setCustomerSearchOpen(false);
                                setCustomerSearchQuery("");
                              }}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{customer.name}</div>
                                <div className="text-sm text-muted-foreground">{customer.email}</div>
                              </div>
                            </CommandItem>
                          ))}
                          <CommandItem
                            value="create-new"
                            onSelect={() => {
                              setNewCustomerName(customerSearchQuery);
                              setShowCreateCustomer(true);
                            }}
                            className="border-t"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create new customer
                          </CommandItem>
                        </CommandGroup>
                      </>
                    ) : (
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          <span className="font-medium">Create New Customer</span>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-name">Customer Name</Label>
                          <Input
                            id="new-customer-name"
                            value={newCustomerName}
                            onChange={(e) => setNewCustomerName(e.target.value)}
                            placeholder="Enter customer name"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowCreateCustomer(false);
                              setNewCustomerName("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleCreateCustomer}>
                            Create
                          </Button>
                        </div>
                      </div>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !issueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {issueDate ? format(issueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={issueDate}
                    onSelect={(date) => date && setIssueDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => date && setDueDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Payment Terms and Template */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select 
                value={formData.paymentTerms} 
                onValueChange={(value) => setFormData({ ...formData, paymentTerms: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermsOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template</Label>
              <Select 
                value={formData.template} 
                onValueChange={(value) => setFormData({ ...formData, template: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoice Items with Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Invoice Items</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Itemization
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Itemization Settings</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="includeItemDetails" className="text-sm">Show Item Details</Label>
                          <Switch
                            id="includeItemDetails"
                            checked={formData.includeItemDetails}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, includeItemDetails: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="groupConsolidatedItems" className="text-sm">Group Consolidated</Label>
                          <Switch
                            id="groupConsolidatedItems"
                            checked={formData.groupConsolidatedItems}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, groupConsolidatedItems: checked })
                            }
                          />
                        </div>
                        {formData.groupConsolidatedItems && (
                          <Input
                            placeholder="Consolidated label"
                            value={formData.consolidatedItemLabel}
                            onChange={(e) =>
                              setFormData({ ...formData, consolidatedItemLabel: e.target.value })
                            }
                          />
                        )}
                        <div className="flex items-center justify-between">
                          <Label htmlFor="autoGrouping" className="text-sm">Auto-Grouping</Label>
                          <Switch
                            id="autoGrouping"
                            checked={formData.autoGroupingRules.enabled}
                            onCheckedChange={(checked) =>
                              setFormData({
                                ...formData,
                                autoGroupingRules: { ...formData.autoGroupingRules, enabled: checked }
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>

            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as "edit" | "preview")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Edit Items</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="edit" className="space-y-3">
                {/* Search for items */}
                {items.length > 1 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {filteredItems.map((item, displayIndex) => {
                    const actualIndex = 'originalIndex' in item ? item.originalIndex : displayIndex;
                    return (
                      <div key={actualIndex} className="space-y-2 p-3 border rounded-lg">
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-5">
                            <Label className="text-xs">Description</Label>
                            <Input
                              placeholder="Item description"
                              value={item.description || ""}
                              onChange={(e) => updateItem(actualIndex, "description", e.target.value)}
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Qty</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || ""}
                              onChange={(e) => updateItem(actualIndex, "quantity", parseInt(e.target.value) || 0)}
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Rate</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.rate || ""}
                              onChange={(e) => updateItem(actualIndex, "rate", parseFloat(e.target.value) || 0)}
                              required
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Amount</Label>
                            <div className="text-sm font-medium p-2 bg-muted rounded">
                              ${(item.amount || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(actualIndex)}
                              disabled={items.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`showDetails-${actualIndex}`}
                              checked={item.showDetails !== false}
                              onCheckedChange={(checked) =>
                                updateItem(actualIndex, "showDetails" as keyof MockInvoiceItem, checked)
                              }
                            />
                            <Label htmlFor={`showDetails-${actualIndex}`} className="text-xs">
                              Show details on invoice
                            </Label>
                          </div>
                          {!item.showDetails && (
                            <Input
                              placeholder="Group ID (optional)"
                              value={item.groupId || ""}
                              onChange={(e) => updateItem(actualIndex, "groupId" as keyof MockInvoiceItem, e.target.value)}
                              className="w-32"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-3">
                <div className="border rounded-lg p-4 bg-muted/10">
                  <p className="text-sm text-muted-foreground mb-3">
                    Preview how items will appear on the invoice with current settings:
                  </p>
                  <HtmlTemplate
                    invoice={{
                      lineItems: items.map(item => ({
                        name: item.description || "",
                        quantity: item.quantity,
                        price: item.rate,
                        showDetails: item.showDetails,
                        groupId: item.groupId,
                      })) as LineItem[],
                      currency: "USD",
                      issueDate: issueDate.toISOString(),
                      dueDate: dueDate.toISOString(),
                      amount: total,
                      subtotal,
                      tax: taxAmount,
                      discount: discountAmount,
                      customerDetails: null,
                      fromDetails: null,
                      template: {
                        ...formData,
                        descriptionLabel: "Description",
                        quantityLabel: "Qty",
                        priceLabel: "Rate",
                        totalLabel: "Total",
                        locale: "en-US",
                        includeDecimals: true,
                        autoGroupingRules: formData.autoGroupingRules,
                      } as Template,
                    } as any}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Tax and Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>Discount</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                />
                <Select 
                  value={formData.discountType} 
                  onValueChange={(value: "fixed" | "percentage") => setFormData({ ...formData, discountType: value })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">$</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {formData.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span className="text-green-600">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Tax ({formData.taxRate}%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between">
            <Label htmlFor="recurring" className="flex flex-col space-y-1">
              <span>Recurring Invoice</span>
              <span className="text-xs text-muted-foreground font-normal">
                Set up automatic recurring invoices
              </span>
            </Label>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Recurring Frequency */}
          {isRecurring && (
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select 
                value={formData.recurringFrequency} 
                onValueChange={(value: "monthly" | "quarterly" | "yearly") => setFormData({ ...formData, recurringFrequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Add any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Terms */}
          <div className="space-y-2">
            <Label>Terms & Conditions</Label>
            <Textarea
              placeholder="Payment terms and conditions..."
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Invoice
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}