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
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Repeat,
  Tag,
  Calendar,
  FileText,
  MessageSquare
} from "lucide-react";
import { cn } from "@midday/ui/cn";
import type { MockTransaction } from "@/lib/mock/transactions-mock";

type Props = {
  transaction: MockTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (transaction: MockTransaction) => void;
  onDelete?: (transaction: MockTransaction) => void;
};

export function TransactionSheet({ 
  transaction, 
  open, 
  onOpenChange,
  onEdit,
  onDelete,
}: Props) {
  if (!transaction) return null;

  const isCredit = transaction.type === "credit";
  const Icon = isCredit ? ArrowUpRight : ArrowDownRight;
  const PaymentIcon = transaction.method === "card" ? CreditCard : Banknote;

  const statusConfig = {
    pending: { label: "Pending", variant: "secondary" as const },
    completed: { label: "Completed", variant: "default" as const },
    failed: { label: "Failed", variant: "destructive" as const },
    cancelled: { label: "Cancelled", variant: "outline" as const },
  };

  const status = statusConfig[transaction.status as keyof typeof statusConfig];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transaction Details</SheetTitle>
          <SheetDescription>
            View and manage transaction information
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Amount and Status */}
          <div className="space-y-4">
            <div className={cn(
              "flex items-center space-x-2 text-3xl font-bold",
              isCredit ? "text-green-600" : "text-red-600"
            )}>
              <Icon className="h-6 w-6" />
              <span>
                {isCredit ? "+" : "-"}
                ${Math.abs(transaction.amount).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              {transaction.isRecurring && (
                <Badge variant="outline">
                  <Repeat className="h-3 w-3 mr-1" />
                  {transaction.recurringFrequency}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Transaction Info */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.description}
                </p>
                {transaction.merchant && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Merchant: {transaction.merchant}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.date), "MMMM dd, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Category</p>
                <Badge variant="outline" className="mt-1">
                  {transaction.category}
                </Badge>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <PaymentIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Account</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.account}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment method: {transaction.method}
                </p>
              </div>
            </div>

            {transaction.reference && (
              <div className="flex items-start space-x-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Reference</p>
                  <p className="text-sm text-muted-foreground font-mono">
                    {transaction.reference}
                  </p>
                </div>
              </div>
            )}

            {transaction.balance !== undefined && (
              <div className="flex items-start space-x-3">
                <Banknote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Balance After</p>
                  <p className="text-sm text-muted-foreground">
                    ${transaction.balance.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Tags */}
          {transaction.tags.length > 0 && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {transaction.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {transaction.notes && (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Notes</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {transaction.notes}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onEdit?.(transaction);
                  onOpenChange(false);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete?.(transaction);
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