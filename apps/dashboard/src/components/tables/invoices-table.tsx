"use client";

import { useTableFilters } from "@/hooks/use-table-filters";
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
import { useState } from "react";
import { type FilterConfig, TableFilters } from "./table-filters";

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
  lineItems?: any[];
  createdAt: string;
  updatedAt?: string;
  sentAt?: string;
  paidAt?: string;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: string) => void;
  onView?: (invoice: Invoice) => void;
  onSend?: (invoiceId: string) => void;
  onDuplicate?: (invoiceId: string) => void;
  onDownload?: (invoiceId: string) => void;
  onMarkPaid?: (invoiceId: string) => void;
}

const filterConfig: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    placeholder: "All statuses",
    options: [
      { label: "Draft", value: "draft" },
      { label: "Sent", value: "sent" },
      { label: "Viewed", value: "viewed" },
      { label: "Paid", value: "paid" },
      { label: "Overdue", value: "overdue" },
      { label: "Cancelled", value: "cancelled" },
    ],
  },
  {
    key: "issueDate",
    label: "Issue Date",
    type: "daterange",
    placeholder: "Select date range",
  },
  {
    key: "dueDate",
    label: "Due Date",
    type: "daterange",
    placeholder: "Select date range",
  },
  {
    key: "amountRange",
    label: "Amount Range",
    type: "numberrange",
    min: 0,
    max: 10000,
    step: 100,
    placeholder: "Filter by amount",
  },
  {
    key: "isPaid",
    label: "Payment Status",
    type: "select",
    placeholder: "All",
    options: [
      { label: "Paid", value: "paid" },
      { label: "Unpaid", value: "unpaid" },
      { label: "Partially Paid", value: "partial" },
    ],
  },
  {
    key: "currency",
    label: "Currency",
    type: "select",
    placeholder: "All currencies",
    options: [
      { label: "AUD", value: "AUD" },
      { label: "USD", value: "USD" },
      { label: "EUR", value: "EUR" },
      { label: "GBP", value: "GBP" },
    ],
  },
];

export function InvoicesTable({
  invoices,
  onEdit,
  onDelete,
  onView,
  onSend,
  onDuplicate,
  onDownload,
  onMarkPaid,
}: InvoicesTableProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<keyof Invoice>("issueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const {
    filters,
    setFilters,
    search,
    handleSearch,
    filterData,
    sortData,
    paginateData,
  } = useTableFilters();

  // Filter invoices
  const filteredInvoices = filterData(invoices, [
    "invoiceNumber",
    "customerName",
    "note",
  ]);

  // Apply additional filters
  const processedInvoices = filteredInvoices.filter((invoice) => {
    if (filters.amountRange && Array.isArray(filters.amountRange)) {
      const amount = invoice.totalAmount / 100;
      if (amount < filters.amountRange[0] || amount > filters.amountRange[1]) {
        return false;
      }
    }

    if (filters.isPaid) {
      const isPaid = invoice.status === "paid";
      if (filters.isPaid === "paid" && !isPaid) return false;
      if (filters.isPaid === "unpaid" && isPaid) return false;
    }

    return true;
  });

  // Sort invoices
  const sortedInvoices = sortData(processedInvoices, sortKey, sortDirection);

  // Paginate invoices
  const paginatedResult = paginateData(sortedInvoices, currentPage, pageSize);

  const handleSort = (key: keyof Invoice) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(paginatedResult.data.map((i) => i.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invoiceId]);
    } else {
      setSelectedInvoices(selectedInvoices.filter((id) => id !== invoiceId));
    }
  };

  const handleExport = () => {
    // Export filtered data as CSV
    const csv = [
      [
        "Invoice Number",
        "Customer",
        "Issue Date",
        "Due Date",
        "Subtotal",
        "Tax",
        "Total",
        "Status",
        "Currency",
      ],
      ...sortedInvoices.map((i) => [
        i.invoiceNumber,
        i.customerName || "",
        format(new Date(i.issueDate), "yyyy-MM-dd"),
        i.dueDate ? format(new Date(i.dueDate), "yyyy-MM-dd") : "",
        (i.subtotal / 100).toFixed(2),
        i.tax ? (i.tax / 100).toFixed(2) : "0.00",
        (i.totalAmount / 100).toFixed(2),
        i.status,
        i.currency || "AUD",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: Invoice["status"]) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
        return "default";
      case "viewed":
        return "default";
      case "paid":
        return "success";
      case "overdue":
        return "destructive";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.floor(
      (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="space-y-4">
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        onExport={handleExport}
        searchPlaceholder="Search invoices by number, customer, or notes..."
      />

      {selectedInvoices.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <span className="text-sm">
            {selectedInvoices.length} invoices selected
          </span>
          <div className="flex gap-2">
            {onSend && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedInvoices.forEach(onSend)}
              >
                Send Selected
              </Button>
            )}
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedInvoices.forEach(onDownload)}
              >
                Download Selected
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    paginatedResult.data.length > 0 &&
                    selectedInvoices.length === paginatedResult.data.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("invoiceNumber")}
              >
                Invoice
                {sortKey === "invoiceNumber" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("issueDate")}
              >
                Issue Date
                {sortKey === "issueDate" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("dueDate")}
              >
                Due Date
                {sortKey === "dueDate" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead
                className="text-right cursor-pointer"
                onClick={() => handleSort("totalAmount")}
              >
                Amount
                {sortKey === "totalAmount" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status
                {sortKey === "status" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResult.data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              paginatedResult.data.map((invoice) => {
                const daysOverdue = invoice.dueDate
                  ? calculateDaysOverdue(invoice.dueDate)
                  : 0;

                return (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoices.includes(invoice.id)}
                        onCheckedChange={(checked) =>
                          handleSelectInvoice(invoice.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <Hash className="h-3 w-3" />
                        {invoice.invoiceNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {invoice.customerName || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(invoice.issueDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.dueDate ? (
                        <div>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                          </div>
                          {daysOverdue > 0 && invoice.status !== "paid" && (
                            <div className="text-xs text-destructive">
                              {daysOverdue} days overdue
                            </div>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>
                        <div className="flex items-center justify-end gap-1 font-medium">
                          <DollarSign className="h-3 w-3" />
                          {(invoice.totalAmount / 100).toFixed(2)}
                        </div>
                        {invoice.tax && invoice.tax > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Tax: ${(invoice.tax / 100).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {onView && (
                            <DropdownMenuItem onClick={() => onView(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Invoice
                            </DropdownMenuItem>
                          )}
                          {onEdit && invoice.status === "draft" && (
                            <DropdownMenuItem onClick={() => onEdit(invoice)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                          )}
                          {onSend && invoice.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => onSend(invoice.id)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send Invoice
                            </DropdownMenuItem>
                          )}
                          {onDownload && (
                            <DropdownMenuItem
                              onClick={() => onDownload(invoice.id)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                          )}
                          {onDuplicate && (
                            <DropdownMenuItem
                              onClick={() => onDuplicate(invoice.id)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                          )}
                          {onMarkPaid && invoice.status !== "paid" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onMarkPaid(invoice.id)}
                              >
                                Mark as Paid
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={() => onDelete(invoice.id)}
                              className="text-destructive"
                            >
                              Delete Invoice
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {paginatedResult.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, paginatedResult.totalItems)} of{" "}
            {paginatedResult.totalItems} invoices
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from(
              { length: Math.min(5, paginatedResult.totalPages) },
              (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              },
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === paginatedResult.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
