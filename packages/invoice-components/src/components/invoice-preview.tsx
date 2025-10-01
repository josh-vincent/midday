"use client";

import { useState } from "react";
import { Card, CardContent } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { ScrollArea } from "@midday/ui/scroll-area";
import { cn } from "@midday/ui/cn";
import { 
  Eye, 
  FileText, 
  Maximize2, 
  Download,
  Printer,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import type { InvoicePreviewProps } from "../types";

export function InvoicePreview({ 
  invoice, 
  template = 'default',
  showActions = true,
  onEdit,
  className 
}: InvoicePreviewProps) {
  const [previewMode, setPreviewMode] = useState<'html' | 'pdf'>('html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFullscreen = () => {
    const newWindow = window.open('', '_blank', 'width=800,height=1000');
    if (newWindow) {
      newWindow.document.write(getInvoiceHTML());
      newWindow.document.close();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(getInvoiceHTML());
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getInvoiceHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            padding: 40px;
            color: #333;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e5e5;
          }
          .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #111;
          }
          .invoice-number {
            font-size: 14px;
            color: #666;
            margin-top: 8px;
          }
          .invoice-status {
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            ${getStatusStyles(invoice.status)}
          }
          .invoice-parties {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
          }
          .party-section h3 {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 12px;
          }
          .party-details {
            font-size: 14px;
            line-height: 1.6;
          }
          .party-details strong {
            font-weight: 600;
            color: #111;
          }
          .invoice-dates {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 40px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
          }
          .date-item {
            text-align: center;
          }
          .date-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
          }
          .date-value {
            font-size: 14px;
            font-weight: 600;
            color: #111;
          }
          .invoice-items {
            margin-bottom: 40px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
          }
          .items-table th {
            text-align: left;
            padding: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #666;
            border-bottom: 2px solid #e5e5e5;
          }
          .items-table td {
            padding: 16px 12px;
            font-size: 14px;
            border-bottom: 1px solid #f0f0f0;
          }
          .items-table .amount {
            text-align: right;
            font-weight: 600;
          }
          .invoice-totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }
          .totals-section {
            width: 300px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .total-row.grand-total {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 2px solid #e5e5e5;
            font-size: 18px;
            font-weight: bold;
          }
          .invoice-notes {
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .invoice-notes h4 {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #666;
            margin-bottom: 8px;
          }
          .invoice-notes p {
            font-size: 14px;
            line-height: 1.6;
            color: #333;
          }
          @media print {
            body { padding: 20px; }
            .invoice-status { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="invoice-header">
            <div>
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-number">#${invoice.number}</div>
            </div>
            <div class="invoice-status">${invoice.status.replace('_', ' ')}</div>
          </div>
          
          <div class="invoice-parties">
            <div class="party-section">
              <h3>From</h3>
              <div class="party-details">
                <strong>Your Company Name</strong><br>
                123 Business St<br>
                City, State 12345<br>
                contact@company.com
              </div>
            </div>
            <div class="party-section">
              <h3>Bill To</h3>
              <div class="party-details">
                <strong>${invoice.customer.name}</strong><br>
                ${invoice.customer.email}<br>
                ${invoice.customer.phone || ''}
                ${invoice.customer.address ? `<br>${invoice.customer.address.street}<br>${invoice.customer.address.city}, ${invoice.customer.address.state} ${invoice.customer.address.zip}` : ''}
              </div>
            </div>
          </div>
          
          <div class="invoice-dates">
            <div class="date-item">
              <div class="date-label">Invoice Date</div>
              <div class="date-value">${format(new Date(invoice.date), 'MMM dd, yyyy')}</div>
            </div>
            <div class="date-item">
              <div class="date-label">Due Date</div>
              <div class="date-value">${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</div>
            </div>
            <div class="date-item">
              <div class="date-label">Terms</div>
              <div class="date-value">${invoice.paymentTerms || 'Net 30'}</div>
            </div>
          </div>
          
          <div class="invoice-items">
            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${invoice.currency} ${item.rate.toFixed(2)}</td>
                    <td class="amount">${invoice.currency} ${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="invoice-totals">
            <div class="totals-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${invoice.currency} ${invoice.subtotal.toFixed(2)}</span>
              </div>
              ${invoice.discount > 0 ? `
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-${invoice.currency} ${invoice.discount.toFixed(2)}</span>
                </div>
              ` : ''}
              ${invoice.tax > 0 ? `
                <div class="total-row">
                  <span>Tax:</span>
                  <span>${invoice.currency} ${invoice.tax.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="total-row grand-total">
                <span>Total:</span>
                <span>${invoice.currency} ${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          ${invoice.notes ? `
            <div class="invoice-notes">
              <h4>Notes</h4>
              <p>${invoice.notes}</p>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  const getStatusStyles = (status: string) => {
    const styles = {
      draft: 'background: #f3f4f6; color: #6b7280;',
      sent: 'background: #dbeafe; color: #1e40af;',
      paid: 'background: #d1fae5; color: #065f46;',
      overdue: 'background: #fee2e2; color: #991b1b;',
      cancelled: 'background: #f3f4f6; color: #6b7280;',
      partially_paid: 'background: #fef3c7; color: #92400e;'
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      {showActions && (
        <div className="border-b px-4 py-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'html' | 'pdf')}>
              <TabsList className="h-8">
                <TabsTrigger value="html" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  HTML Preview
                </TabsTrigger>
                <TabsTrigger value="pdf" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  PDF Preview
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFullscreen}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] w-full">
          {previewMode === 'html' ? (
            <div 
              className="p-6 bg-white"
              dangerouslySetInnerHTML={{ __html: getInvoiceHTML() }}
            />
          ) : (
            <div className="p-6 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  PDF preview will be rendered here
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {}}
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}