"use client";

import { SearchCustomers } from "@/components/search-customers";
import { useInvoiceDataTemplateParams } from "@/hooks/use-invoice-data-template-params";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Checkbox } from "@midday/ui/checkbox";
import { Icons } from "@midday/ui/icons";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { Skeleton } from "@midday/ui/skeleton";
import { Textarea } from "@midday/ui/textarea";
import { useToast } from "@midday/ui/use-toast";
import { useEffect, useState } from "react";

const currencies = [
  { code: "USD", name: "US Dollar ($)" },
  { code: "AUD", name: "Australian Dollar (A$)" }
];

interface LineItem {
  description: string;
  quantity: number;
  price: number;
  unit?: string;
}

interface PaymentDetails {
  terms: string;
  methods: string[];
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    routingNumber: string;
    bankName: string;
  };
  notes?: string;
}

interface CompanyDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  abn?: string;
  logo?: string;
}

interface NoteDetails {
  header?: string;
  footer?: string;
  terms?: string;
  thankYou?: string;
}

export function InvoiceDataTemplateUpdateSheet() {
  const { templateId, create, edit, setParams } =
    useInvoiceDataTemplateParams();
  const [isEditing, setIsEditing] = useState(false);
  const trpc = useTRPC();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine sheet mode
  const isOpen = Boolean(create || templateId);
  const isCreate = Boolean(create);
  const isPreview = Boolean(templateId && !isEditing && !isCreate);

  // Comprehensive form state matching schema
  const [formData, setFormData] = useState({
    // Basic info
    name: "",
    description: "",
    currency: "USD",
    customerId: "",
    isDefault: false,

    // Financial settings
    vat: 0,
    tax: 0,
    discount: 0,

    // Line items template
    lineItems: [
      {
        description: "Professional Services",
        quantity: 1,
        price: 0,
        unit: "hour",
      },
    ] as LineItem[],

    // Payment details
    paymentDetails: {
      terms: "Net 30",
      methods: ["bank_transfer", "credit_card"],
      notes: "",
    } as PaymentDetails,

    // Company details (from details)
    companyDetails: {
      name: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      abn: "",
    } as CompanyDetails,

    // Note details
    noteDetails: {
      header: "Thank you for your business!",
      footer: "Payment is due within 30 days of invoice date.",
      terms: "",
      thankYou:
        "We appreciate your business and look forward to working with you again.",
    } as NoteDetails,

    // Template configuration
    template: {
      showLogo: true,
      showPaymentQr: false,
      colorScheme: "blue",
      showCompanyDetails: true,
      showPaymentDetails: true,
    },

    // Content blocks
    topBlock: {
      message: "",
      showDate: true,
      showInvoiceNumber: true,
    },

    bottomBlock: {
      message: "",
      showTerms: true,
      showThankYou: true,
    },
  });

  // Data fetching
  const { data, isLoading } = useQuery({
    ...trpc.invoiceDataTemplates.getById.queryOptions({ id: templateId! }),
    enabled: Boolean(templateId),
    staleTime: 0,
  });

  // Update form when data loads
  useEffect(() => {
    if (data && !isCreate) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
        currency: data.currency || "USD",
        customerId: data.customerId || "",
        isDefault: data.isDefault || false,
        vat: data.vat || 0,
        tax: data.tax || 0,
        discount: data.discount || 0,
        lineItems: data.lineItems || [
          {
            description: "Professional Services",
            quantity: 1,
            price: 0,
            unit: "hour",
          },
        ],
        paymentDetails: data.paymentDetails || {
          terms: "Net 30",
          methods: ["bank_transfer"],
          notes: "",
        },
        companyDetails: data.companyDetails || {
          name: "",
          address: "",
          phone: "",
          email: "",
          website: "",
          abn: "",
        },
        noteDetails: data.noteDetails || {
          header: "Thank you for your business!",
          footer: "Payment is due within 30 days of invoice date.",
          terms: "",
          thankYou:
            "We appreciate your business and look forward to working with you again.",
        },
        template: data.template || {
          showLogo: true,
          showPaymentQr: false,
          colorScheme: "blue",
          showCompanyDetails: true,
          showPaymentDetails: true,
        },
        topBlock: data.topBlock || {
          message: "",
          showDate: true,
          showInvoiceNumber: true,
        },
        bottomBlock: data.bottomBlock || {
          message: "",
          showTerms: true,
          showThankYou: true,
        },
      });
    }
  }, [data, isCreate]);

  // Mutations
  const createMutation = useMutation(
    trpc.invoiceDataTemplates.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceDataTemplates.get.infiniteQueryKey(),
        });

        // Invalidate onboarding progress to update setup checklist
        queryClient.invalidateQueries({
          queryKey: trpc.team.getOnboardingProgress.queryKey(),
        });

        setParams({ create: null, templateId: null });
        toast({ title: "Template created successfully" });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create template",
          variant: "destructive",
        });
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.invoiceDataTemplates.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.invoiceDataTemplates.get.infiniteQueryKey(),
        });
        setIsEditing(false);
        toast({ title: "Template updated successfully" });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update template",
          variant: "destructive",
        });
      },
    }),
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setParams({ create: null, templateId: null, edit: null });
      setIsEditing(false);
      // Reset to default form data
      setFormData({
        name: "",
        description: "",
        currency: "USD",
        customerId: "",
        isDefault: false,
        vat: 0,
        tax: 0,
        discount: 0,
        lineItems: [
          {
            description: "Professional Services",
            quantity: 1,
            price: 0,
            unit: "hour",
          },
        ],
        paymentDetails: {
          terms: "Net 30",
          methods: ["bank_transfer", "credit_card"],
          notes: "",
        },
        companyDetails: {
          name: "",
          address: "",
          phone: "",
          email: "",
          website: "",
          abn: "",
        },
        noteDetails: {
          header: "Thank you for your business!",
          footer: "Payment is due within 30 days of invoice date.",
          terms: "",
          thankYou:
            "We appreciate your business and look forward to working with you again.",
        },
        template: {
          showLogo: true,
          showPaymentQr: false,
          colorScheme: "blue",
          showCompanyDetails: true,
          showPaymentDetails: true,
        },
        topBlock: {
          message: "",
          showDate: true,
          showInvoiceNumber: true,
        },
        bottomBlock: {
          message: "",
          showTerms: true,
          showThankYou: true,
        },
      });
    }
  };

  const handleSave = () => {
    const saveData = {
      name: formData.name,
      description: formData.description,
      currency: formData.currency,
      customerId: formData.customerId || undefined,
      isDefault: formData.isDefault,
      vat: formData.vat,
      tax: formData.tax,
      discount: formData.discount,
      lineItems: formData.lineItems,
      paymentDetails: formData.paymentDetails,
      companyDetails: formData.companyDetails,
      noteDetails: formData.noteDetails,
      template: formData.template,
      fromDetails: formData.companyDetails, // Use company details as from details
      topBlock: formData.topBlock,
      bottomBlock: formData.bottomBlock,
    };

    if (isCreate) {
      createMutation.mutate(saveData);
    } else {
      updateMutation.mutate({
        id: templateId!,
        ...saveData,
      });
    }
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { description: "", quantity: 1, price: 0, unit: "item" },
      ],
    }));
  };

  const removeLineItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const isValid = formData.name.trim() !== "";

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle>
              {isCreate
                ? "Create Invoice Template"
                : isPreview
                  ? "Template Details"
                  : "Edit Template"}
            </SheetTitle>

            {!isCreate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {isLoading && !isCreate ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isPreview ? (
            // Preview Mode - Comprehensive Template Details
            <div className="space-y-6">
              <Accordion
                type="multiple"
                defaultValue={["basic", "company", "payment", "financial"]}
              >
                {/* Basic Information */}
                <AccordionItem value="basic">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.Invoice className="size-4" />
                      <span>Template Information</span>
                      {data?.isDefault && (
                        <Badge variant="secondary" className="text-xs ml-2">
                          <Icons.Star className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Template Name
                            </Label>
                            <p className="text-sm font-medium">{data?.name}</p>
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Currency
                            </Label>
                            <p className="text-sm">{data?.currency}</p>
                          </div>
                        </div>

                        {data?.description && (
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Description
                            </Label>
                            <p className="text-sm">{data.description}</p>
                          </div>
                        )}

                        {data?.customer && (
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Customer-Specific Template
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Icons.Customers className="w-4 h-4 text-[#606060]" />
                              <div>
                                <p className="text-sm font-medium">
                                  {data.customer.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {data.customer.email}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                {/* Company Details */}
                <AccordionItem value="company">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.Building className="size-4" />
                      <span>Company Information</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        {data?.companyDetails ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {data.companyDetails.name && (
                                <div>
                                  <Label className="text-xs font-medium text-muted-foreground">
                                    Company Name
                                  </Label>
                                  <p className="text-sm">
                                    {data.companyDetails.name}
                                  </p>
                                </div>
                              )}

                              {data.companyDetails.email && (
                                <div>
                                  <Label className="text-xs font-medium text-muted-foreground">
                                    Business Email
                                  </Label>
                                  <p className="text-sm">
                                    {data.companyDetails.email}
                                  </p>
                                </div>
                              )}

                              {data.companyDetails.phone && (
                                <div>
                                  <Label className="text-xs font-medium text-muted-foreground">
                                    Business Phone
                                  </Label>
                                  <p className="text-sm">
                                    {data.companyDetails.phone}
                                  </p>
                                </div>
                              )}

                              {data.companyDetails.abn && (
                                <div>
                                  <Label className="text-xs font-medium text-muted-foreground">
                                    ABN/Tax ID
                                  </Label>
                                  <p className="text-sm">
                                    {data.companyDetails.abn}
                                  </p>
                                </div>
                              )}
                            </div>

                            {data.companyDetails.address && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Business Address
                                </Label>
                                <p className="text-sm whitespace-pre-line">
                                  {data.companyDetails.address}
                                </p>
                              </div>
                            )}

                            {data.companyDetails.website && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Website
                                </Label>
                                <p className="text-sm text-blue-600 hover:underline">
                                  <a
                                    href={data.companyDetails.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {data.companyDetails.website}
                                  </a>
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No company information configured
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                {/* Line Items */}
                {data?.lineItems &&
                  Array.isArray(data.lineItems) &&
                  data.lineItems.length > 0 && (
                    <AccordionItem value="lineitems">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Icons.ListCheck className="size-4" />
                          <span>
                            Default Line Items ({data.lineItems.length})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <Card>
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              {data.lineItems.map(
                                (item: any, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">
                                        {item.description}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Qty: {item.quantity} × {data.currency}{" "}
                                        {item.price}
                                        {item.unit && ` per ${item.unit}`}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium">
                                        {data.currency}{" "}
                                        {(item.quantity * item.price).toFixed(
                                          2,
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                {/* Payment Information */}
                <AccordionItem value="payment">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.CreditCard className="size-4" />
                      <span>Payment Information</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        {data?.paymentDetails ? (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Payment Terms
                                </Label>
                                <p className="text-sm">
                                  {data.paymentDetails.terms || "Net 30"}
                                </p>
                              </div>

                              {data.paymentDetails.methods &&
                                data.paymentDetails.methods.length > 0 && (
                                  <div>
                                    <Label className="text-xs font-medium text-muted-foreground">
                                      Accepted Payment Methods
                                    </Label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {data.paymentDetails.methods.map(
                                        (method: string) => (
                                          <Badge
                                            key={method}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {method
                                              .replace("_", " ")
                                              .replace(/\b\w/g, (l: string) =>
                                                l.toUpperCase(),
                                              )}
                                          </Badge>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>

                            {data.paymentDetails.notes && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Payment Notes
                                </Label>
                                <p className="text-sm">
                                  {data.paymentDetails.notes}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No payment information configured
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                {/* Financial Settings */}
                <AccordionItem value="financial">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.Currency className="size-4" />
                      <span>Tax & Pricing Settings</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-muted rounded-lg">
                            <Label className="text-xs font-medium text-muted-foreground">
                              VAT Rate
                            </Label>
                            <p className="text-lg font-bold text-green-600">
                              {data?.vat || 0}%
                            </p>
                          </div>

                          <div className="text-center p-3 bg-muted rounded-lg">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Tax Rate
                            </Label>
                            <p className="text-lg font-bold text-blue-600">
                              {data?.tax || 0}%
                            </p>
                          </div>

                          <div className="text-center p-3 bg-muted rounded-lg">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Default Discount
                            </Label>
                            <p className="text-lg font-bold text-orange-600">
                              {data?.discount || 0}%
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>

                {/* Notes & Messages */}
                {data?.noteDetails && (
                  <AccordionItem value="notes">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Icons.EventNote className="size-4" />
                        <span>Template Messages</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card>
                        <CardContent className="pt-4 space-y-4">
                          {data.noteDetails.header && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">
                                Header Message
                              </Label>
                              <p className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                                {data.noteDetails.header}
                              </p>
                            </div>
                          )}

                          {data.noteDetails.thankYou && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">
                                Thank You Message
                              </Label>
                              <p className="text-sm bg-green-50 p-2 rounded border-l-2 border-green-200">
                                {data.noteDetails.thankYou}
                              </p>
                            </div>
                          )}

                          {data.noteDetails.footer && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">
                                Footer Message
                              </Label>
                              <p className="text-sm bg-gray-50 p-2 rounded border-l-2 border-gray-200">
                                {data.noteDetails.footer}
                              </p>
                            </div>
                          )}

                          {data.noteDetails.terms && (
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">
                                Terms & Conditions
                              </Label>
                              <p className="text-sm bg-orange-50 p-2 rounded border-l-2 border-orange-200 whitespace-pre-line">
                                {data.noteDetails.terms}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Template Configuration */}
                {data?.template && (
                  <AccordionItem value="display">
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Icons.Palette className="size-4" />
                        <span>Display & Layout</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Card>
                        <CardContent className="pt-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs font-medium text-muted-foreground">
                                Color Scheme
                              </Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 ${
                                    data.template.colorScheme === "blue"
                                      ? "bg-blue-500"
                                      : data.template.colorScheme === "green"
                                        ? "bg-green-500"
                                        : data.template.colorScheme === "purple"
                                          ? "bg-purple-500"
                                          : data.template.colorScheme ===
                                              "orange"
                                            ? "bg-orange-500"
                                            : "bg-gray-500"
                                  }`}
                                />
                                <p className="text-sm capitalize">
                                  {data.template.colorScheme || "Default"}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Display Options
                            </Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {[
                                { key: "showLogo", label: "Company Logo" },
                                {
                                  key: "showPaymentQr",
                                  label: "Payment QR Code",
                                },
                                {
                                  key: "showCompanyDetails",
                                  label: "Company Details",
                                },
                                {
                                  key: "showPaymentDetails",
                                  label: "Payment Details",
                                },
                              ].map((option) => (
                                <div
                                  key={option.key}
                                  className="flex items-center space-x-2"
                                >
                                  <Icons.Check
                                    className={`w-3 h-3 ${
                                      data.template[option.key]
                                        ? "text-green-600"
                                        : "text-gray-300"
                                    }`}
                                  />
                                  <span
                                    className={`text-xs ${
                                      data.template[option.key]
                                        ? "text-foreground"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {option.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Header and Footer Configuration */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.topBlock && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Header Options
                                </Label>
                                <div className="space-y-1 mt-1">
                                  <div className="flex items-center space-x-2">
                                    <Icons.Check
                                      className={`w-3 h-3 ${
                                        data.topBlock.showDate
                                          ? "text-green-600"
                                          : "text-gray-300"
                                      }`}
                                    />
                                    <span className="text-xs">
                                      Show Invoice Date
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Icons.Check
                                      className={`w-3 h-3 ${
                                        data.topBlock.showInvoiceNumber
                                          ? "text-green-600"
                                          : "text-gray-300"
                                      }`}
                                    />
                                    <span className="text-xs">
                                      Show Invoice Number
                                    </span>
                                  </div>
                                  {data.topBlock.message && (
                                    <div className="mt-2">
                                      <Label className="text-xs font-medium text-muted-foreground">
                                        Custom Header
                                      </Label>
                                      <p className="text-xs bg-blue-50 p-2 rounded">
                                        {data.topBlock.message}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {data.bottomBlock && (
                              <div>
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Footer Options
                                </Label>
                                <div className="space-y-1 mt-1">
                                  <div className="flex items-center space-x-2">
                                    <Icons.Check
                                      className={`w-3 h-3 ${
                                        data.bottomBlock.showTerms
                                          ? "text-green-600"
                                          : "text-gray-300"
                                      }`}
                                    />
                                    <span className="text-xs">Show Terms</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Icons.Check
                                      className={`w-3 h-3 ${
                                        data.bottomBlock.showThankYou
                                          ? "text-green-600"
                                          : "text-gray-300"
                                      }`}
                                    />
                                    <span className="text-xs">
                                      Show Thank You Message
                                    </span>
                                  </div>
                                  {data.bottomBlock.message && (
                                    <div className="mt-2">
                                      <Label className="text-xs font-medium text-muted-foreground">
                                        Custom Footer
                                      </Label>
                                      <p className="text-xs bg-gray-50 p-2 rounded">
                                        {data.bottomBlock.message}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
          ) : (
            // Create/Edit Mode - Comprehensive Form
            <div className="space-y-6">
              <Accordion
                type="multiple"
                defaultValue={["basic", "company", "payment"]}
              >
                {/* Basic Information */}
                <AccordionItem value="basic">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.Invoice className="size-4" />
                      <span>Basic Information</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="name">Template Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Standard Service Invoice Template"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          placeholder="Description of this template and when to use it..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="currency">Default Currency *</Label>
                          <Select
                            value={formData.currency}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                currency: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem
                                  key={currency.code}
                                  value={currency.code}
                                >
                                  {currency.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Customer-Specific Template</Label>
                          <SearchCustomers
                            value={formData.customerId}
                            onChange={(customerId) =>
                              setFormData((prev) => ({ ...prev, customerId }))
                            }
                            placeholder="Leave empty for general template"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isDefault"
                          checked={formData.isDefault}
                          onCheckedChange={(checked) =>
                            setFormData((prev) => ({
                              ...prev,
                              isDefault: Boolean(checked),
                            }))
                          }
                        />
                        <Label
                          htmlFor="isDefault"
                          className="text-sm font-normal"
                        >
                          Set as default template
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Company Details */}
                <AccordionItem value="company">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.Building className="size-4" />
                      <span>Company Information</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input
                          id="companyName"
                          value={formData.companyDetails.name}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                name: e.target.value,
                              },
                            }))
                          }
                          placeholder="Your Company Name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="companyEmail">Business Email</Label>
                        <Input
                          id="companyEmail"
                          type="email"
                          value={formData.companyDetails.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                email: e.target.value,
                              },
                            }))
                          }
                          placeholder="billing@company.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="companyPhone">Business Phone</Label>
                        <Input
                          id="companyPhone"
                          value={formData.companyDetails.phone}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                phone: e.target.value,
                              },
                            }))
                          }
                          placeholder="(555) 123-4567"
                        />
                      </div>

                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.companyDetails.website || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                website: e.target.value,
                              },
                            }))
                          }
                          placeholder="https://company.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="abn">ABN/Tax ID</Label>
                        <Input
                          id="abn"
                          value={formData.companyDetails.abn || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              companyDetails: {
                                ...prev.companyDetails,
                                abn: e.target.value,
                              },
                            }))
                          }
                          placeholder="12 345 678 901"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Business Address</Label>
                      <Textarea
                        id="address"
                        value={formData.companyDetails.address}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            companyDetails: {
                              ...prev.companyDetails,
                              address: e.target.value,
                            },
                          }))
                        }
                        placeholder="123 Business Street&#10;City, State 12345&#10;Country"
                        rows={3}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Line Items Template */}
                <AccordionItem value="lineitems">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.ListCheck className="size-4" />
                      <span>Default Line Items</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    {formData.lineItems.map((item, index) => (
                      <Card key={index} className="border-muted">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium">
                              Line Item {index + 1}
                            </Label>
                            {formData.lineItems.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLineItem(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Icons.Delete className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={item.description}
                                onChange={(e) =>
                                  updateLineItem(
                                    index,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                placeholder="Service description"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Quantity</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateLineItem(
                                    index,
                                    "quantity",
                                    Number(e.target.value),
                                  )
                                }
                                placeholder="1"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Unit Price</Label>
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  updateLineItem(
                                    index,
                                    "price",
                                    Number(e.target.value),
                                  )
                                }
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    <Button
                      variant="outline"
                      onClick={addLineItem}
                      className="w-full"
                    >
                      <Icons.Plus className="mr-2 h-4 w-4" />
                      Add Line Item
                    </Button>
                  </AccordionContent>
                </AccordionItem>

                {/* Payment Details */}
                <AccordionItem value="payment">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.CreditCard className="size-4" />
                      <span>Payment Information</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Select
                          value={formData.paymentDetails.terms}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentDetails: {
                                ...prev.paymentDetails,
                                terms: value,
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment terms" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Due on receipt">
                              Due on receipt
                            </SelectItem>
                            <SelectItem value="Net 15">Net 15 days</SelectItem>
                            <SelectItem value="Net 30">Net 30 days</SelectItem>
                            <SelectItem value="Net 60">Net 60 days</SelectItem>
                            <SelectItem value="Net 90">Net 90 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Payment Methods</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {[
                          "bank_transfer",
                          "credit_card",
                          "check",
                          "cash",
                          "paypal",
                        ].map((method) => (
                          <div
                            key={method}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={method}
                              checked={formData.paymentDetails.methods.includes(
                                method,
                              )}
                              onCheckedChange={(checked) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  paymentDetails: {
                                    ...prev.paymentDetails,
                                    methods: checked
                                      ? [...prev.paymentDetails.methods, method]
                                      : prev.paymentDetails.methods.filter(
                                          (m) => m !== method,
                                        ),
                                  },
                                }));
                              }}
                            />
                            <Label
                              htmlFor={method}
                              className="text-sm font-normal"
                            >
                              {method
                                .replace("_", " ")
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="paymentNotes">Payment Notes</Label>
                      <Textarea
                        id="paymentNotes"
                        value={formData.paymentDetails.notes || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentDetails: {
                              ...prev.paymentDetails,
                              notes: e.target.value,
                            },
                          }))
                        }
                        placeholder="Additional payment instructions..."
                        rows={2}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Tax Settings */}
                <AccordionItem value="tax">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.Currency className="size-4" />
                      <span>Tax & Pricing Settings</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="vat">VAT Rate (%)</Label>
                        <Input
                          id="vat"
                          type="number"
                          value={formData.vat}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              vat: Number(e.target.value),
                            }))
                          }
                          placeholder="0.00"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tax">Tax Rate (%)</Label>
                        <Input
                          id="tax"
                          type="number"
                          value={formData.tax}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              tax: Number(e.target.value),
                            }))
                          }
                          placeholder="0.00"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <Label htmlFor="discount">Default Discount (%)</Label>
                        <Input
                          id="discount"
                          type="number"
                          value={formData.discount}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              discount: Number(e.target.value),
                            }))
                          }
                          placeholder="0.00"
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Template Notes & Messages */}
                <AccordionItem value="notes">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.EventNote className="size-4" />
                      <span>Notes & Messages</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div>
                      <Label htmlFor="header">Header Message</Label>
                      <Input
                        id="header"
                        value={formData.noteDetails.header || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            noteDetails: {
                              ...prev.noteDetails,
                              header: e.target.value,
                            },
                          }))
                        }
                        placeholder="Thank you for your business!"
                      />
                    </div>

                    <div>
                      <Label htmlFor="thankYou">Thank You Message</Label>
                      <Textarea
                        id="thankYou"
                        value={formData.noteDetails.thankYou || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            noteDetails: {
                              ...prev.noteDetails,
                              thankYou: e.target.value,
                            },
                          }))
                        }
                        placeholder="We appreciate your business and look forward to working with you again."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="footer">Footer Message</Label>
                      <Textarea
                        id="footer"
                        value={formData.noteDetails.footer || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            noteDetails: {
                              ...prev.noteDetails,
                              footer: e.target.value,
                            },
                          }))
                        }
                        placeholder="Payment is due within 30 days of invoice date."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="terms">Terms & Conditions</Label>
                      <Textarea
                        id="terms"
                        value={formData.noteDetails.terms || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            noteDetails: {
                              ...prev.noteDetails,
                              terms: e.target.value,
                            },
                          }))
                        }
                        placeholder="Enter your standard terms and conditions..."
                        rows={3}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Template Display Options */}
                <AccordionItem value="display">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Icons.Palette className="size-4" />
                      <span>Display Options</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Color Scheme</Label>
                        <Select
                          value={formData.template.colorScheme}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              template: {
                                ...prev.template,
                                colorScheme: value,
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                            <SelectItem value="orange">Orange</SelectItem>
                            <SelectItem value="gray">Gray</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Display Options</Label>
                      {[
                        { key: "showLogo", label: "Show Company Logo" },
                        { key: "showPaymentQr", label: "Show Payment QR Code" },
                        {
                          key: "showCompanyDetails",
                          label: "Show Company Details",
                        },
                        {
                          key: "showPaymentDetails",
                          label: "Show Payment Details",
                        },
                      ].map((option) => (
                        <div
                          key={option.key}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={option.key}
                            checked={formData.template[option.key]}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                template: {
                                  ...prev.template,
                                  [option.key]: Boolean(checked),
                                },
                              }))
                            }
                          />
                          <Label
                            htmlFor={option.key}
                            className="text-sm font-normal"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <Label>Header Options</Label>
                      {[
                        { key: "showDate", label: "Show Invoice Date" },
                        {
                          key: "showInvoiceNumber",
                          label: "Show Invoice Number",
                        },
                      ].map((option) => (
                        <div
                          key={option.key}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`top_${option.key}`}
                            checked={formData.topBlock[option.key]}
                            onCheckedChange={(checked) =>
                              setFormData((prev) => ({
                                ...prev,
                                topBlock: {
                                  ...prev.topBlock,
                                  [option.key]: Boolean(checked),
                                },
                              }))
                            }
                          />
                          <Label
                            htmlFor={`top_${option.key}`}
                            className="text-sm font-normal"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label htmlFor="headerMessage">
                        Custom Header Message
                      </Label>
                      <Input
                        id="headerMessage"
                        value={formData.topBlock.message || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            topBlock: {
                              ...prev.topBlock,
                              message: e.target.value,
                            },
                          }))
                        }
                        placeholder="Professional Services Invoice"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bottomMessage">
                        Custom Footer Message
                      </Label>
                      <Input
                        id="bottomMessage"
                        value={formData.bottomBlock.message || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            bottomBlock: {
                              ...prev.bottomBlock,
                              message: e.target.value,
                            },
                          }))
                        }
                        placeholder="Thank you for choosing our services"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Save/Cancel Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    !isValid ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : "Save Template"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
