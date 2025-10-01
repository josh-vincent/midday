"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Badge } from "@midday/ui/badge";
import { Separator } from "@midday/ui/separator";
import { format } from "date-fns";
import { 
  Edit, 
  Trash, 
  Download, 
  Share,
  Send,
  Eye,
  Copy,
  Calendar,
  FileText,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Receipt
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockInvoice } from "@/lib/mock/invoices-mock";

type Props = {
  invoice: MockInvoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (invoice: MockInvoice) => void;
  onDelete?: (invoice: MockInvoice) => void;
  onSend?: (invoice: MockInvoice) => void;
  onDownload?: (invoice: MockInvoice) => void;
};

export function InvoiceSheet({ 
  invoice, 
  open, 
  onOpenChange,
  onEdit,
  onDelete,
  onSend,
  onDownload,
}: Props) {
  if (!invoice) return null;

  const statusConfig = {
    draft: { label: "Draft", variant: "secondary" as const, icon: FileText },
    sent: { label: "Sent", variant: "default" as const, icon: Send },
    paid: { label: "Paid", variant: "default" as const, icon: CheckCircle },
    overdue: { label: "Overdue", variant: "destructive" as const, icon: Clock },
    cancelled: { label: "Cancelled", variant: "outline" as const, icon: XCircle },
    partially_paid: { label: "Partially Paid", variant: "secondary" as const, icon: DollarSign },
  };

  const status = statusConfig[invoice.status];
  const StatusIcon = status.icon;

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== "paid";
  const daysPastDue = isOverdue ? Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[600px] overflow-y-auto bg-white dark:bg-[#0C0C0C] transition-[max-width] duration-300 ease-in-out"
      >
        <SheetHeader>
          <SheetTitle>Invoice {invoice.number}</SheetTitle>
          <SheetDescription>
            View and manage invoice details
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Amount */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                ${invoice.total.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={status.variant} className="flex items-center space-x-1">
                  <StatusIcon className="h-3 w-3" />
                  <span>{status.label}</span>
                </Badge>
                {invoice.recurring && (
                  <Badge variant="outline">
                    <Receipt className="h-3 w-3 mr-1" />
                    Recurring
                  </Badge>
                )}
              </div>
            </div>

            {isOverdue && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  This invoice is {daysPastDue} day{daysPastDue > 1 ? 's' : ''} overdue
                </p>
              </div>
            )}

            {invoice.amountPaid > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-medium text-green-600">
                    ${invoice.amountPaid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Due:</span>
                  <span className="font-medium">
                    ${invoice.amountDue.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Invoice Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(invoice.date), "MMM dd, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Due Date</p>
                <p className={cn(
                  "text-sm",
                  isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
                )}>
                  {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          <div className="space-y-4">
            <h4 className="font-medium">Customer Information</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{invoice.customer.name}</p>
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{invoice.customer.email}</span>
                    </div>
                    {invoice.customer.phone && (
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{invoice.customer.phone}</span>
                      </div>
                    )}
                    {invoice.customer.address && (
                      <div className="flex items-start space-x-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mt-0.5" />
                        <span>
                          {invoice.customer.address.street}, {invoice.customer.address.city}, {invoice.customer.address.state} {invoice.customer.address.zip}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div className="space-y-4">
            <h4 className="font-medium">Invoice Items</h4>
            <div className="space-y-3">
              {invoice.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × ${item.rate.toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    ${item.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>${invoice.subtotal.toLocaleString()}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Discount {invoice.discountType === "percentage" ? `(${invoice.discount}%)` : ""}:
                  </span>
                  <span className="text-green-600">
                    -${(invoice.discountType === "percentage" 
                      ? invoice.subtotal * invoice.discount / 100 
                      : invoice.discount
                    ).toLocaleString()}
                  </span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({(invoice.taxRate * 100).toFixed(1)}%):</span>
                  <span>${invoice.tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total:</span>
                <span>${invoice.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Terms */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Payment Terms</p>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {invoice.paymentTerms.replace('_', ' ').toUpperCase()}
            </p>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Notes</p>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  {invoice.notes}
                </p>
              </div>
            </>
          )}

          {/* Activity */}
          {(invoice.sentAt || invoice.viewedAt || invoice.paidAt) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium">Activity</h4>
                <div className="space-y-2 text-sm">
                  {invoice.sentAt && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Send className="h-3 w-3" />
                      <span>Sent on {format(new Date(invoice.sentAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                    </div>
                  )}
                  {invoice.viewedAt && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>Viewed on {format(new Date(invoice.viewedAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                    </div>
                  )}
                  {invoice.paidAt && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Paid on {format(new Date(invoice.paidAt), "MMM dd, yyyy 'at' h:mm a")}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit?.(invoice);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {invoice.status === "draft" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSend?.(invoice);
                    onOpenChange(false);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onDownload?.(invoice)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete?.(invoice);
                onOpenChange(false);
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}