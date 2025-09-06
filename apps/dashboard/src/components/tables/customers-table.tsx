"use client";

import { CustomersCSVImporter } from "@/components/import/customers-csv-importer";
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
  FileText,
  Globe,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";
import { type FilterConfig, FilterValue, TableFilters } from "./table-filters";

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  contactPerson?: string;
  abn?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt?: string;
  totalInvoices?: number;
  totalRevenue?: number;
}

interface CustomersTableProps {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onView?: (customer: Customer) => void;
  onCreateInvoice?: (customerId: string) => void;
}

const filterConfig: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    placeholder: "All statuses",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
  {
    key: "country",
    label: "Country",
    type: "select",
    placeholder: "All countries",
    options: [
      { label: "Australia", value: "Australia" },
      { label: "New Zealand", value: "New Zealand" },
      { label: "United States", value: "United States" },
      { label: "United Kingdom", value: "United Kingdom" },
    ],
  },
  {
    key: "state",
    label: "State",
    type: "select",
    placeholder: "All states",
    options: [
      { label: "NSW", value: "NSW" },
      { label: "VIC", value: "VIC" },
      { label: "QLD", value: "QLD" },
      { label: "WA", value: "WA" },
      { label: "SA", value: "SA" },
      { label: "TAS", value: "TAS" },
      { label: "ACT", value: "ACT" },
      { label: "NT", value: "NT" },
    ],
  },
  {
    key: "createdAt",
    label: "Created Date",
    type: "daterange",
    placeholder: "Select date range",
  },
  {
    key: "hasInvoices",
    label: "Has Invoices",
    type: "boolean",
    placeholder: "All",
  },
];

export function CustomersTable({
  customers,
  onEdit,
  onDelete,
  onView,
  onCreateInvoice,
}: CustomersTableProps) {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showImporter, setShowImporter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<keyof Customer>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const {
    filters,
    setFilters,
    search,
    handleSearch,
    filterData,
    sortData,
    paginateData,
  } = useTableFilters();

  // Filter customers
  const filteredCustomers = filterData(customers, [
    "name",
    "email",
    "contactPerson",
    "abn",
  ]);

  // Apply additional filters
  const processedCustomers = filteredCustomers.filter((customer) => {
    if (filters.hasInvoices !== undefined) {
      const hasInvoices = (customer.totalInvoices || 0) > 0;
      if (filters.hasInvoices && !hasInvoices) return false;
      if (!filters.hasInvoices && hasInvoices) return false;
    }
    return true;
  });

  // Sort customers
  const sortedCustomers = sortData(processedCustomers, sortKey, sortDirection);

  // Paginate customers
  const paginatedResult = paginateData(sortedCustomers, currentPage, pageSize);

  const handleSort = (key: keyof Customer) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(paginatedResult.data.map((c) => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId));
    }
  };

  const handleExport = () => {
    // Export filtered data as CSV
    const csv = [
      [
        "Name",
        "Email",
        "Phone",
        "Contact Person",
        "ABN",
        "Status",
        "City",
        "State",
        "Country",
      ],
      ...sortedCustomers.map((c) => [
        c.name,
        c.email || "",
        c.phone || "",
        c.contactPerson || "",
        c.abn || "",
        c.status,
        c.city || "",
        c.state || "",
        c.country || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={setFilters}
        onSearch={handleSearch}
        onExport={handleExport}
        onImport={() => setShowImporter(true)}
        searchPlaceholder="Search customers by name, email, contact, or ABN..."
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    paginatedResult.data.length > 0 &&
                    selectedCustomers.length === paginatedResult.data.length
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Customer
                {sortKey === "name" && (
                  <span className="ml-1">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
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
              <TableHead className="text-right">Invoices</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                Created
                {sortKey === "createdAt" && (
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
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              paginatedResult.data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={(checked) =>
                        handleSelectCustomer(customer.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.name}</div>
                      {customer.abn && (
                        <div className="text-xs text-muted-foreground">
                          ABN: {customer.abn}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.contactPerson && (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3" />
                          {customer.contactPerson}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                      )}
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.address}
                        </div>
                      )}
                      {(customer.city ||
                        customer.state ||
                        customer.postalCode) && (
                        <div className="text-muted-foreground">
                          {[customer.city, customer.state, customer.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      )}
                      {customer.country && (
                        <div className="text-muted-foreground">
                          {customer.country}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        customer.status === "active" ? "default" : "secondary"
                      }
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {customer.totalInvoices || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {customer.totalRevenue
                      ? `$${(customer.totalRevenue / 100).toFixed(2)}`
                      : "$0.00"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(customer.createdAt), "MMM d, yyyy")}
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
                          <DropdownMenuItem onClick={() => onView(customer)}>
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(customer)}>
                            Edit Customer
                          </DropdownMenuItem>
                        )}
                        {onCreateInvoice && (
                          <DropdownMenuItem
                            onClick={() => onCreateInvoice(customer.id)}
                          >
                            Create Invoice
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(customer.id)}
                            className="text-destructive"
                          >
                            Delete Customer
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {paginatedResult.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, paginatedResult.totalItems)} of{" "}
            {paginatedResult.totalItems} customers
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

      <CustomersCSVImporter
        open={showImporter}
        onOpenChange={setShowImporter}
      />
    </div>
  );
}
