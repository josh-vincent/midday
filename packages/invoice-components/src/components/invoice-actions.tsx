"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import { useToast } from "@midday/ui/use-toast";
import { cn } from "@midday/ui/cn";
import { 
  Eye,
  Download,
  Share2,
  Send,
  Edit,
  Copy,
  Trash,
  ExternalLink,
  Link,
  Mail,
  MoreHorizontal,
  FileText,
  Printer
} from "lucide-react";
import type { InvoiceActionsProps } from "../types";
import { InvoiceShareDialog } from "./invoice-share-dialog";
import { generateInvoicePDF, downloadInvoicePDF } from "../utils/generate-pdf";
import { generateShareableLink } from "../utils/share-link";

export function InvoiceActions({ 
  invoice, 
  onPreview,
  onDownloadPDF,
  onShare,
  onSend,
  onEdit,
  onDuplicate,
  onDelete,
  className 
}: InvoiceActionsProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { toast } = useToast();

  const handleOpenInNewWindow = () => {
    const invoiceWindow = window.open('', '_blank', 'width=900,height=1200');
    if (invoiceWindow) {
      invoiceWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.number}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              margin: 0;
              padding: 0;
              background: #f9fafb;
            }
            .toolbar {
              background: white;
              border-bottom: 1px solid #e5e7eb;
              padding: 16px 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              position: sticky;
              top: 0;
              z-index: 100;
            }
            .toolbar-title {
              font-size: 18px;
              font-weight: 600;
            }
            .toolbar-actions {
              display: flex;
              gap: 12px;
            }
            .btn {
              padding: 8px 16px;
              border: 1px solid #e5e7eb;
              background: white;
              border-radius: 6px;
              font-size: 14px;
              cursor: pointer;
              transition: all 0.2s;
            }
            .btn:hover {
              background: #f9fafb;
            }
            .btn-primary {
              background: #3b82f6;
              color: white;
              border-color: #3b82f6;
            }
            .btn-primary:hover {
              background: #2563eb;
            }
            .invoice-container {
              max-width: 850px;
              margin: 32px auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              padding: 48px;
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <div class="toolbar-title">Invoice ${invoice.number}</div>
            <div class="toolbar-actions">
              <button class="btn" onclick="window.print()">Print</button>
              <button class="btn btn-primary" onclick="window.close()">Close</button>
            </div>
          </div>
          <div class="invoice-container">
            <!-- Invoice content would be rendered here -->
            <h1>Invoice ${invoice.number}</h1>
            <p>Customer: ${invoice.customer.name}</p>
            <p>Amount: ${invoice.currency} ${invoice.total.toFixed(2)}</p>
            <p>Status: ${invoice.status}</p>
          </div>
        </body>
        </html>
      `);
      invoiceWindow.document.close();
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      if (onDownloadPDF) {
        await onDownloadPDF();
      } else {
        await downloadInvoicePDF(invoice);
      }
      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoice.number} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopyLink = async () => {
    setIsGeneratingLink(true);
    try {
      const link = await generateShareableLink(invoice);
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied",
        description: "Invoice link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to generate shareable link",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleSendInvoice = () => {
    if (onSend) {
      onSend();
    } else {
      // Default email behavior
      const subject = encodeURIComponent(`Invoice ${invoice.number}`);
      const body = encodeURIComponent(`
Dear ${invoice.customer.name},

Please find attached invoice ${invoice.number} for ${invoice.currency} ${invoice.total.toFixed(2)}.

Due date: ${new Date(invoice.dueDate).toLocaleDateString()}

Thank you for your business.

Best regards
      `);
      window.location.href = `mailto:${invoice.customer.email}?subject=${subject}&body=${body}`;
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${invoice.number}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body onload="window.print()">
          <!-- Invoice content for printing -->
          <h1>Invoice ${invoice.number}</h1>
          <p>Customer: ${invoice.customer.name}</p>
          <p>Total: ${invoice.currency} ${invoice.total.toFixed(2)}</p>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {/* Primary Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenInNewWindow}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onPreview || handleOpenInNewWindow}
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
        >
          <Download className="h-4 w-4 mr-2" />
          {isGeneratingPDF ? "Generating..." : "Download PDF"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsShareDialogOpen(true)}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        {invoice.status === 'draft' && (
          <Button
            variant="default"
            size="sm"
            onClick={handleSendInvoice}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        )}

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleCopyLink} disabled={isGeneratingLink}>
              <Link className="h-4 w-4 mr-2" />
              {isGeneratingLink ? "Generating..." : "Copy Link"}
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleSendInvoice}>
              <Mail className="h-4 w-4 mr-2" />
              Email Invoice
            </DropdownMenuItem>
            
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Share Dialog */}
      <InvoiceShareDialog
        invoice={invoice}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
    </>
  );
}