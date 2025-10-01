"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@midday/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Input } from "@midday/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { useToast } from "@midday/ui/use-toast";
import { 
  ArrowLeft,
  Download,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Receipt
} from "lucide-react";
import { authAPI, type MockUser } from "@/lib/mock/auth-mock";
import { billingAPI, type MockInvoice } from "@/lib/mock/billing-mock";

interface InvoiceFilters {
  status: string;
  dateRange: string;
  search: string;
}

export default function InvoicesPage() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [invoices, setInvoices] = useState<MockInvoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<MockInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<InvoiceFilters>({
    status: 'all',
    dateRange: 'all',
    search: '',
  });

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, invoices]);

  const loadData = async () => {
    try {
      const currentUser = await authAPI.getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const userInvoices = await billingAPI.getInvoices(currentUser.id);
        setInvoices(userInvoices);
      }
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case '30':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '90':
          filterDate.setDate(now.getDate() - 90);
          break;
        case '365':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          filterDate.setTime(0);
      }
      
      filtered = filtered.filter(invoice => invoice.createdAt >= filterDate);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.description.toLowerCase().includes(searchLower) ||
        invoice.id.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setFilteredInvoices(filtered);
  };

  const handleDownload = async (invoiceId: string) => {
    setDownloading(invoiceId);
    try {
      const downloadUrl = await billingAPI.downloadInvoice(invoiceId);
      
      // In a real app, this would trigger a download
      window.open(downloadUrl, '_blank');
      
      toast({
        title: "Download started",
        description: "Your invoice is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'void':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'uncollectible':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'open':
        return 'default';
      case 'void':
        return 'secondary';
      case 'uncollectible':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getTotalAmount = () => {
    return filteredInvoices.reduce((total, invoice) => total + invoice.amount, 0);
  };

  const getPaidAmount = () => {
    return filteredInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.amount, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Billing
            </Button>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Invoices</h1>
                <p className="text-muted-foreground">
                  View and download your billing invoices
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                    <p className="text-2xl font-bold">{filteredInvoices.length}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">${getTotalAmount().toFixed(2)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Paid Amount</p>
                    <p className="text-2xl font-bold">${getPaidAmount().toFixed(2)}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoices..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="void">Void</SelectItem>
                      <SelectItem value="uncollectible">Uncollectible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ status: 'all', dateRange: 'all', search: '' })}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>
                {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length > 0 ? (
                <div className="space-y-4">
                  {filteredInvoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(invoice.status)}
                        <div>
                          <div className="font-medium">{invoice.description}</div>
                          <div className="text-sm text-muted-foreground">
                            Invoice #{invoice.id} • {invoice.createdAt.toLocaleDateString()}
                          </div>
                          {invoice.dueDate && (
                            <div className="text-sm text-muted-foreground">
                              Due: {invoice.dueDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">${invoice.amount.toFixed(2)}</div>
                          <Badge variant={getStatusBadgeVariant(invoice.status)}>
                            {formatStatus(invoice.status)}
                          </Badge>
                        </div>

                        {invoice.downloadUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(invoice.id)}
                            disabled={downloading === invoice.id}
                          >
                            {downloading === invoice.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
                  <p className="text-muted-foreground mb-4">
                    {filters.search || filters.status !== 'all' || filters.dateRange !== 'all'
                      ? "Try adjusting your filters to see more results."
                      : "You don't have any invoices yet. Invoices will appear here once you have an active subscription."
                    }
                  </p>
                  {filters.search || filters.status !== 'all' || filters.dateRange !== 'all' ? (
                    <Button 
                      onClick={() => setFilters({ status: 'all', dateRange: 'all', search: '' })}
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button onClick={() => router.push('/billing/plans')}>
                      View Plans
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download All */}
          {filteredInvoices.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Need help with your invoices? Contact our support team for assistance.
              </p>
              <div className="space-x-2">
                <Button variant="outline">
                  Contact Support
                </Button>
                <Button variant="outline">
                  Download All Invoices
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}