"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Separator } from "@midday/ui/separator";
import { 
  ChevronLeft,
  FormInput,
  DollarSign,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  File
} from "lucide-react";
import { cn } from "@midday/ui/cn";

// Mock TextField Component
const TextField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  error, 
  helperText,
  required
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}) => {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(error && "border-red-500")}
      />
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};

// Mock CurrencyField Component
const CurrencyField = ({ 
  label, 
  value, 
  onChange, 
  currency = "USD",
  error 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  error?: string;
}) => {
  const formatCurrency = (input: string) => {
    // Remove non-numeric characters except decimal point
    const numericValue = input.replace(/[^0-9.]/g, '');
    
    // Parse and format as currency
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    
    return number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleChange}
          placeholder="0.00"
          className={cn("pl-10", error && "border-red-500")}
        />
      </div>
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
};

// Mock FileUploadField Component
const FileUploadField = ({ 
  label, 
  files, 
  onChange, 
  accept, 
  maxFiles = 5,
  error 
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string[];
  maxFiles?: number;
  error?: string;
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles = [...files, ...droppedFiles].slice(0, maxFiles);
    onChange(newFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newFiles = [...files, ...selectedFiles].slice(0, maxFiles);
      onChange(newFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          error && "border-red-500"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
        <p className="text-sm font-medium mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {accept && `Accepts: ${accept.join(', ')}`}
        </p>
        <input
          type="file"
          multiple
          accept={accept?.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <Button asChild variant="outline" size="sm">
          <label htmlFor="file-upload" className="cursor-pointer">
            Choose Files
          </label>
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploaded Files ({files.length}/{maxFiles})</p>
          <div className="space-y-2">
            {files.map((file, index) => {
              const IconComponent = getFileIcon(file);
              return (
                <div key={index} className="flex items-center gap-3 p-2 border rounded">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
};

export default function FormComponentsShowcase() {
  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    email: "",
    phone: "",
    company: "",
    amount: "",
    description: "",
    files: [] as File[]
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<Array<{ id: number; message: string; type: "success" | "error" }>>([]);

  const addNotification = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Customer name is required";
    } else if (formData.customerName.length < 2) {
      newErrors.customerName = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else {
      const numericValue = parseFloat(formData.amount.replace(/,/g, ''));
      if (isNaN(numericValue) || numericValue <= 0) {
        newErrors.amount = "Amount must be greater than 0";
      }
    }

    if (formData.files.length === 0) {
      newErrors.files = "At least one document is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      addNotification("Form submitted successfully!", "success");
      // Reset form
      setFormData({
        customerName: "",
        email: "",
        phone: "",
        company: "",
        amount: "",
        description: "",
        files: []
      });
      setErrors({});
    } else {
      addNotification("Please fix the errors below", "error");
    }
  };

  const updateField = (field: string, value: string | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <>
      <div className="space-y-8">
        {/* Back Navigation */}
        <div>
          <Link href="/packages">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Packages
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-purple-500 flex items-center justify-center text-white">
              <FormInput className="h-10 w-10" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">@midday/form-components</h1>
                  <Badge className="text-white bg-green-500" variant="secondary">
                    stable
                  </Badge>
                  <Badge variant="outline">v1.0.0</Badge>
                </div>
                <p className="text-lg text-muted-foreground">
                  Specialized form input components including text fields, currency fields, and file upload components. Built for business applications with validation.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button asChild>
                  <a href="https://github.com/midday-ai/form-components" target="_blank" rel="noopener noreferrer">
                    View Source
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://docs.midday.ai/packages/form-components" target="_blank" rel="noopener noreferrer">
                    Documentation
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Interactive Demo */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Interactive Demo</h2>
            <p className="text-muted-foreground">
              Complete invoice creation form showcasing all form components with validation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Invoice</CardTitle>
                <CardDescription>
                  Fill out the form to create a new invoice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <TextField
                    label="Customer Name"
                    value={formData.customerName}
                    onChange={(value) => updateField('customerName', value)}
                    placeholder="Enter customer name..."
                    required
                    error={errors.customerName}
                    helperText="Enter the full legal name of the customer"
                  />

                  <TextField
                    label="Email Address"
                    value={formData.email}
                    onChange={(value) => updateField('email', value)}
                    placeholder="customer@example.com"
                    required
                    error={errors.email}
                    helperText="We'll send the invoice to this email"
                  />

                  <TextField
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(value) => updateField('phone', value)}
                    placeholder="+1 (555) 123-4567"
                    helperText="Optional contact number"
                  />

                  <TextField
                    label="Company"
                    value={formData.company}
                    onChange={(value) => updateField('company', value)}
                    placeholder="Company name..."
                    helperText="Customer's company or organization"
                  />

                  <CurrencyField
                    label="Invoice Amount"
                    value={formData.amount}
                    onChange={(value) => updateField('amount', value)}
                    error={errors.amount}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Describe the services or products..."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      Optional description of work performed
                    </p>
                  </div>

                  <FileUploadField
                    label="Supporting Documents"
                    files={formData.files}
                    onChange={(files) => updateField('files', files)}
                    accept={['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx']}
                    maxFiles={5}
                    error={errors.files}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Create Invoice
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setFormData({
                          customerName: "",
                          email: "",
                          phone: "",
                          company: "",
                          amount: "",
                          description: "",
                          files: []
                        });
                        setErrors({});
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Form Preview</CardTitle>
                <CardDescription>
                  Live preview of entered data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-3">Invoice Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer:</span>
                        <span>{formData.customerName || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{formData.email || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{formData.phone || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Company:</span>
                        <span>{formData.company || "—"}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Amount:</span>
                        <span>{formData.amount ? `$${formData.amount}` : "—"}</span>
                      </div>
                    </div>
                  </div>

                  {formData.description && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">
                        {formData.description}
                      </p>
                    </div>
                  )}

                  {formData.files.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Attachments ({formData.files.length})</h4>
                      <div className="space-y-1">
                        {formData.files.map((file, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {file.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!formData.customerName && !formData.email && !formData.amount && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FormInput className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Start filling the form to see a preview</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
            <CardDescription>
              What makes these form components special
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Real-time Validation
                </h4>
                <p className="text-sm text-muted-foreground">
                  Immediate feedback with customizable validation rules
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Auto-formatting
                </h4>
                <p className="text-sm text-muted-foreground">
                  Automatic formatting for currency, phone numbers, and more
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  File Upload with Preview
                </h4>
                <p className="text-sm text-muted-foreground">
                  Drag-and-drop file uploads with progress and preview
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Accessibility First
                </h4>
                <p className="text-sm text-muted-foreground">
                  Full keyboard navigation and screen reader support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation */}
        <Card>
          <CardHeader>
            <CardTitle>Installation</CardTitle>
            <CardDescription>
              Get started with @midday/form-components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">npm</h4>
              <code className="block p-3 bg-muted rounded-md text-sm font-mono">
                npm install @midday/form-components
              </code>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Usage</h4>
              <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto">
                <code>{`import { TextField, CurrencyField, FileUploadField } from "@midday/form-components";

// Text Field with validation
<TextField
  label="Customer Name"
  value={customerName}
  onChange={setCustomerName}
  validation={{
    required: "Name is required",
    minLength: { value: 2, message: "Too short" }
  }}
/>

// Currency Field with formatting
<CurrencyField
  label="Amount"
  value={amount}
  onChange={setAmount}
  currency="USD"
  prefix="$"
  decimalScale={2}
/>

// File Upload with preview
<FileUploadField
  label="Documents"
  files={files}
  onChange={setFiles}
  accept={['.pdf', '.jpg', '.png']}
  maxFiles={5}
  preview={true}
/>`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "p-3 rounded-md shadow-lg border flex items-center gap-2",
              notification.type === "success" 
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            )}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {notification.message}
          </div>
        ))}
      </div>
    </>
  );
}