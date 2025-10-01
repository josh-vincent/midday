"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { FileText, Settings, Download, Eye } from "lucide-react";
import { invoiceTemplates, getCategories, type InvoiceTemplate } from "@/lib/invoice-templates";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvoiceTemplates() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const router = useRouter();
  const categories = ["All", ...getCategories()];

  const filteredTemplates = selectedCategory === "All" 
    ? invoiceTemplates 
    : invoiceTemplates.filter(t => t.category === selectedCategory);

  const handleUseTemplate = (template: InvoiceTemplate) => {
    // Store template in localStorage for the create invoice form to use
    localStorage.setItem('selectedInvoiceTemplate', JSON.stringify(template));
    router.push('/invoices/create');
  };

  const handlePreview = (template: InvoiceTemplate) => {
    setSelectedTemplate(template);
    // Could open a modal here to preview the template
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Invoice Templates</h2>
          <p className="text-muted-foreground">Choose a template to quickly create professional invoices</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Customize Templates
        </Button>
      </div>

      <Tabs defaultValue="All" value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid grid-cols-7 w-full max-w-3xl">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Terms:</span>
                        <span className="font-medium">{template.defaults.paymentTerms} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Currency:</span>
                        <span className="font-medium">{template.defaults.currency}</span>
                      </div>
                      {template.defaults.taxRate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax Rate:</span>
                          <span className="font-medium">{template.defaults.taxRate}%</span>
                        </div>
                      )}
                      {template.defaults.vatRate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">VAT Rate:</span>
                          <span className="font-medium">{template.defaults.vatRate}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleUseTemplate(template)}
                      >
                        Use Template
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePreview(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No templates found in this category</p>
        </div>
      )}
    </div>
  );
}