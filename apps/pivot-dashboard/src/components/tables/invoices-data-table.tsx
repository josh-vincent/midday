"use client";

import { useInvoicesStore } from "@/store/invoices";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Checkbox } from "@midday/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { format } from "date-fns";
import {
  Building,
  Calendar,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileText,
  Hash,
  MoreHorizontal,
  Send,
} from "lucide-react";
import { useEffect } from "react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName?: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  tax?: number;
  totalAmount: number;
  status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled";
  currency?: string;
  note?: string;
}

interface InvoicesDataTableProps {
  invoices: Invoice[];
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (id: string) => void;
  onView?: (invoice: Invoice) => void;
  onSend?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDownload?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
}

export function InvoicesDataTable({
  invoices,
  onEdit,
  onDelete,
  onView,
  onSend,
  onDuplicate,
  onDownload,
  onMarkPaid,
}: InvoicesDataTableProps) {
  const rowSelection = useInvoicesStore((state) => state.rowSelection);
  const setRowSelection = useInvoicesStore((state) => state.setRowSelection);
  const columnVisibility = useInvoicesStore((state) => state.columnVisibility);
  const setInvoices = useInvoicesStore((state) => state.setInvoices);
  const filters = useInvoicesStore((state) => state.filters);

  useEffect(() => {
    setInvoices(invoices);
  }, [invoices, setInvoices]);

  // Apply filters
  let filteredInvoices = invoices;

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredInvoices = filteredInvoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.customerName?.toLowerCase().includes(searchLower) ||
        invoice.note?.toLowerCase().includes(searchLower),
    );
  }

  if (filters.status.length > 0) {
    filteredInvoices = filteredInvoices.filter((invoice) =>
      filters.status.includes(invoice.status),
    );
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection: Record<string, boolean> = {};
      filteredInvoices.forEach((invoice) => {
        newSelection[invoice.id] = true;
      });
      setRowSelection(newSelection);
    } else {
      setRowSelection({});
    }
  };

  const handleSelectRow = (invoiceId: string, checked: boolean) => {
    const newSelection = { ...rowSelection };
    if (checked) {
      newSelection[invoiceId] = true;
    } else {
      delete newSelection[invoiceId];
    }
    setRowSelection(newSelection);
  };

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
      case "viewed":
        return "default";
      case "paid":
        return "success";
      case "overdue":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const isAllSelected =
    filteredInvoices.length > 0 &&
    filteredInvoices.every((invoice) => rowSelection[invoice.id]);

  const isIndeterminate =
    filteredInvoices.some((invoice) => rowSelection[invoice.id]) && !isAllSelected;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onCheckedChange={handleSelectAll}
                />
              </div>
            </TableHead>
            {(columnVisibility.invoiceNumber ?? true) && (
              <TableHead>Invoice</TableHead>
            )}
            {(columnVisibility.customer ?? true) && (
              <TableHead>Customer</TableHead>
            )}
            {(columnVisibility.issueDate ?? true) && (
              <TableHead>Issue Date</TableHead>
            )}
            {(columnVisibility.dueDate ?? true) && (
              <TableHead>Due Date</TableHead>
            )}
            {(columnVisibility.amount ?? true) && (
              <TableHead className="text-right">Amount</TableHead>
            )}
            {(columnVisibility.status ?? true) && (
              <TableHead>Status</TableHead>
            )}
            {(columnVisibility.actions ?? true) && (
              <TableHead className="w-12"></TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInvoices.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-center py-8 text-muted-foreground"
              >
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            filteredInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className={rowSelection[invoice.id] ? "bg-muted/50" : ""}
              >
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={rowSelection[invoice.id] || false}
                      onCheckedChange={(checked) =>
                        handleSelectRow(invoice.id, checked as boolean)
                      }
                    />
                  </div>
                </TableCell>
                {(columnVisibility.invoiceNumber ?? true) && (
                  <TableCell>
                    <div>
                      <div className="flex items-center gap-1 font-medium">
                        <Hash className="h-3 w-3" />
                        {invoice.invoiceNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {invoice.id.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                )}
                {(columnVisibility.customer ?? true) && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {invoice.customerName || "Unknown"}
                    </div>
                  </TableCell>
                )}
                {(columnVisibility.issueDate ?? true) && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                )}
                {(columnVisibility.dueDate ?? true) && (
                  <TableCell>
                    {invoice.dueDate ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                )}
                {(columnVisibility.amount ?? true) && (
                  <TableCell className="text-right">
                    <div>
                      <div className="flex items-center justify-end gap-1 font-medium">
                        <DollarSign className="h-3 w-3" />
                        {((invoice.totalAmount || 0) / 100).toFixed(2)}
                      </div>
                      {invoice.currency && (
                        <div className="text-xs text-muted-foreground text-right">
                          {invoice.currency}
                        </div>
                      )}
                    </div>
                  </TableCell>
                )}
                {(columnVisibility.status ?? true) && (
                  <TableCell>
                    <Badge variant={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                )}
                {(columnVisibility.actions ?? true) && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(invoice)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(invoice)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDuplicate && (
                          <DropdownMenuItem onClick={() => onDuplicate(invoice.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onSend && invoice.status === "draft" && (
                          <DropdownMenuItem onClick={() => onSend(invoice.id)}>
                            <Send className="mr-2 h-4 w-4" />
                            Send
                          </DropdownMenuItem>
                        )}
                        {onDownload && (
                          <DropdownMenuItem onClick={() => onDownload(invoice.id)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                        )}
                        {onMarkPaid && invoice.status !== "paid" && (
                          <DropdownMenuItem onClick={() => onMarkPaid(invoice.id)}>
                            <DollarSign className="mr-2 h-4 w-4" />
                            Mark as Paid
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(invoice.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}