"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { useToast } from "@midday/ui/use-toast";
import { 
  Users, 
  UserPlus, 
  TrendingUp,
  DollarSign,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle
} from "lucide-react";

// Components
import { CustomersDataTable } from "@/components/tables/customers/data-table";
import { CustomersHeader } from "@/components/customers-header";
import { CustomerSheet } from "@/components/sheets/customer-sheet";
import { CustomerCreateSheet } from "@/components/sheets/customer-create-sheet";
import { CustomerStats } from "@/components/customers/customer-stats";
import { CustomerImportSheet } from "@/components/sheets/customer-import-sheet";

// Mock data
import { customersAPI, type MockCustomer } from "@/lib/mock/customers-mock";

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // State
  const [customers, setCustomers] = useState<MockCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  // Sheet states
  const [selectedCustomer, setSelectedCustomer] = useState<MockCustomer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [showImportCustomers, setShowImportCustomers] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customersAPI.getCustomers();
      setCustomers(data);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || customer.status === statusFilter;
    const matchesType = !typeFilter || customer.type === typeFilter;
    const matchesTag = !tagFilter || customer.tags?.includes(tagFilter);
    const matchesTab = 
      activeTab === "all" || 
      (activeTab === "active" && customer.status === "active") ||
      (activeTab === "inactive" && customer.status === "inactive") ||
      (activeTab === "vip" && customer.tags?.includes("vip")) ||
      (activeTab === "new" && customer.isNew);
    
    return matchesSearch && matchesStatus && matchesType && matchesTag && matchesTab;
  });

  // Calculate stats
  const stats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.status === "active").length,
    newCustomers: customers.filter(c => c.isNew).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.totalRevenue, 0),
    avgRevenue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.totalRevenue, 0) / customers.length 
      : 0,
    avgLifetimeValue: customers.length > 0
      ? customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / customers.length
      : 0,
    churnRate: 5.2, // Mock
    retentionRate: 94.8, // Mock
  };

  // Event handlers
  const handleCustomerClick = (customer: MockCustomer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleEditCustomer = (customer: MockCustomer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  const handleDeleteCustomer = async (customer: MockCustomer) => {
    try {
      await customersAPI.deleteCustomer(customer.id);
      toast({
        title: "Customer deleted",
        description: "The customer has been deleted successfully",
      });
      await loadCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    }
  };

  const handleArchiveCustomer = async (customer: MockCustomer) => {
    try {
      await customersAPI.updateCustomer(customer.id, { status: "inactive" });
      toast({
        title: "Customer archived",
        description: `${customer.name} has been archived`,
      });
      await loadCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive customer",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = (customer: MockCustomer) => {
    toast({
      title: "Create invoice",
      description: `Creating new invoice for ${customer.name}`,
    });
  };

  const handleSendEmail = (customer: MockCustomer) => {
    toast({
      title: "Email sent",
      description: `Email sent to ${customer.email}`,
    });
  };

  const handleCreateCustomer = async (data: any) => {
    try {
      const newCustomer = await customersAPI.createCustomer(data);
      toast({
        title: "Customer created",
        description: `${newCustomer.name} has been added successfully`,
      });
      setShowCreateCustomer(false);
      await loadCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    }
  };

  const handleImportCustomers = async (file: File) => {
    try {
      toast({
        title: "Import started",
        description: "Your customers are being imported",
      });
      setShowImportCustomers(false);
      setTimeout(() => {
        loadCustomers();
        toast({
          title: "Import complete",
          description: "25 customers have been imported successfully",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import customers",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your customers are being exported",
    });
  };

  const handleRefresh = () => {
    loadCustomers();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <CustomersHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        onCreateCustomer={() => setShowCreateCustomer(true)}
        onImportCustomers={() => setShowImportCustomers(true)}
        onExport={handleExport}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        totalCustomers={customers.length}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Customers
              <Users className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+{stats.newCustomers}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Active
              <Activity className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.activeCustomers}
            </div>
            <p className="text-xs text-muted-foreground">
              {((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(0)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Total Revenue
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Avg Lifetime Value
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.floor(stats.avgLifetimeValue).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Per customer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Retention Rate
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.retentionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              Last 12 months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          <TabsTrigger value="vip">VIP</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          <CustomersDataTable
            data={filteredCustomers}
            loading={loading}
            hasFilters={!!searchQuery || !!statusFilter || !!typeFilter || !!tagFilter}
            onCustomerClick={handleCustomerClick}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onArchiveCustomer={handleArchiveCustomer}
            onCreateInvoice={handleCreateInvoice}
            onSendEmail={handleSendEmail}
          />

          {activeTab === "all" && (
            <CustomerStats customers={customers} />
          )}
        </TabsContent>
      </Tabs>

      {/* Sheet Components */}
      <CustomerSheet
        customer={selectedCustomer}
        open={showCustomerDetails}
        onOpenChange={setShowCustomerDetails}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        onArchive={handleArchiveCustomer}
        onCreateInvoice={handleCreateInvoice}
        onSendEmail={handleSendEmail}
      />

      <CustomerCreateSheet
        open={showCreateCustomer}
        onOpenChange={setShowCreateCustomer}
        onCreate={handleCreateCustomer}
      />

      <CustomerImportSheet
        open={showImportCustomers}
        onOpenChange={setShowImportCustomers}
        onImport={handleImportCustomers}
      />
    </div>
  );
}