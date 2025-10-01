"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { useToast } from "@midday/ui/use-toast";
import { 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Clock,
  TrendingUp
} from "lucide-react";

// Import from shared package
import { InvoiceTable, MockDataProvider } from "@midday/table-components";
import type { Invoice } from "@midday/table-components";

// Components
import { InvoicesHeader } from "@/components/invoices-header";
import { InvoiceSheet } from "@/components/sheets/invoice-sheet";
import { InvoiceCreateSheet } from "@/components/sheets/invoice-create-sheet";
import { InvoiceStats } from "@/components/invoices/invoice-stats";
import { InvoiceTemplateSheet } from "@/components/sheets/invoice-template-sheet";

// Mock data
import { invoicesAPI } from "@/lib/mock/invoices-mock";

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataProvider, setDataProvider] = useState<MockDataProvider<Invoice> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  // Sheet states
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesAPI.getInvoices();
      
      // Convert mock data to Invoice type and create provider
      const convertedInvoices: Invoice[] = data.map(inv => ({
        ...inv,
        customer: {
          name: inv.customer.name,
          email: inv.customer.email
        }
      }));
      
      setInvoices(convertedInvoices);
      
      // Create filtered data based on active tab and filters
      const filteredData = convertedInvoices.filter(invoice => {
        const matchesSearch = 
          invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          invoice.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || invoice.status === statusFilter;
        const matchesDate = 
          new Date(invoice.date) >= dateRange.from && 
          new Date(invoice.date) <= dateRange.to;
        const matchesTab = 
          activeTab === "all" || 
          (activeTab === "draft" && invoice.status === "draft") ||
          (activeTab === "sent" && invoice.status === "sent") ||
          (activeTab === "paid" && invoice.status === "paid") ||
          (activeTab === "overdue" && invoice.status === "overdue") ||
          (activeTab === "cancelled" && invoice.status === "cancelled");
        
        return matchesSearch && matchesStatus && matchesDate && matchesTab;
      });
      
      // Create provider with filtered data
      setDataProvider(new MockDataProvider(filteredData));
    } finally {
      setLoading(false);
    }
  };

  // Update provider when filters change
  useEffect(() => {
    if (!invoices.length) return;

    const filteredData = invoices.filter(invoice => {
      const matchesSearch = 
        invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      const matchesDate = 
        new Date(invoice.date) >= dateRange.from && 
        new Date(invoice.date) <= dateRange.to;
      const matchesTab = 
        activeTab === "all" || 
        (activeTab === "draft" && invoice.status === "draft") ||
        (activeTab === "sent" && invoice.status === "sent") ||
        (activeTab === "paid" && invoice.status === "paid") ||
        (activeTab === "overdue" && invoice.status === "overdue") ||
        (activeTab === "cancelled" && invoice.status === "cancelled");
      
      return matchesSearch && matchesStatus && matchesDate && matchesTab;
    });
    
    setDataProvider(new MockDataProvider(filteredData));
  }, [invoices, searchQuery, statusFilter, customerFilter, dateRange, activeTab]);

  // Calculate stats
  const stats = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
    paidAmount: invoices
      .filter(inv => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total, 0),
    unpaidAmount: invoices
      .filter(inv => ["sent", "overdue"].includes(inv.status))
      .reduce((sum, inv) => sum + inv.total, 0),
    overdueCount: invoices.filter(inv => inv.status === "overdue").length,
    draftCount: invoices.filter(inv => inv.status === "draft").length,
    avgDaysToPayment: 15, // Mock
    paymentScore: 85, // Mock
  };

  // Event handlers
  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetails(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetails(true);
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      await invoicesAPI.deleteInvoice(invoice.id);
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully",
      });
      await loadInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      await invoicesAPI.updateInvoice(invoice.id, { status: "sent", sentAt: new Date().toISOString() });
      toast({
        title: "Invoice sent",
        description: `Invoice ${invoice.number} has been sent to ${invoice.customer.email}`,
      });
      await loadInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invoice",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateInvoice = async (invoice: Invoice) => {
    try {
      const newInvoice = await invoicesAPI.duplicateInvoice(invoice.id);
      toast({
        title: "Invoice duplicated",
        description: `New invoice ${newInvoice.number} has been created`,
      });
      await loadInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate invoice",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      await invoicesAPI.updateInvoice(invoice.id, { 
        status: "paid", 
        paidAt: new Date().toISOString() 
      });
      toast({
        title: "Invoice marked as paid",
        description: `Invoice ${invoice.number} has been marked as paid`,
      });
      await loadInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark invoice as paid",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = async (data: any) => {
    try {
      const newInvoice = await invoicesAPI.createInvoice(data);
      toast({
        title: "Invoice created",
        description: `Invoice ${newInvoice.number} has been created successfully`,
      });
      setShowCreateInvoice(false);
      await loadInvoices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your invoices are being exported",
    });
  };

  const handleRefresh = () => {
    loadInvoices();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCustomerFilter("");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <InvoicesHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        customerFilter={customerFilter}
        onCustomerFilterChange={setCustomerFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onCreateInvoice={() => setShowCreateInvoice(true)}
        onManageTemplates={() => setShowTemplateManager(true)}
        onExport={handleExport}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        totalInvoices={invoices.length}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Amount
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalInvoices} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Paid
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${stats.paidAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((stats.paidAmount / stats.totalAmount) * 100).toFixed(0)}% collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Unpaid
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              ${stats.unpaidAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Overdue
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.overdueCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Payment Score
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.paymentScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {stats.avgDaysToPayment} days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          {/* Use the shared InvoiceTable component */}
          {dataProvider && (
            <InvoiceTable
              provider={dataProvider}
              loading={loading}
              hasFilters={!!searchQuery || !!statusFilter || !!customerFilter}
              onInvoiceClick={handleInvoiceClick}
              onEditInvoice={handleEditInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onSendInvoice={handleSendInvoice}
              onDuplicateInvoice={handleDuplicateInvoice}
              onMarkAsPaid={handleMarkAsPaid}
              onCreateInvoice={() => setShowCreateInvoice(true)}
              onImportInvoices={() => toast({ title: "Import feature coming soon" })}
              onClearFilters={handleClearFilters}
              pageSize={25}
            />
          )}

          {activeTab === "all" && (
            <InvoiceStats invoices={invoices} />
          )}
        </TabsContent>
      </Tabs>

      {/* Sheet Components */}
      <InvoiceSheet
        invoice={selectedInvoice}
        open={showInvoiceDetails}
        onOpenChange={setShowInvoiceDetails}
        onEdit={handleEditInvoice}
        onDelete={handleDeleteInvoice}
        onSend={handleSendInvoice}
        onDuplicate={handleDuplicateInvoice}
        onMarkAsPaid={handleMarkAsPaid}
      />

      <InvoiceCreateSheet
        open={showCreateInvoice}
        onOpenChange={setShowCreateInvoice}
        onCreate={handleCreateInvoice}
      />

      <InvoiceTemplateSheet
        open={showTemplateManager}
        onOpenChange={setShowTemplateManager}
      />
    </div>
  );
}