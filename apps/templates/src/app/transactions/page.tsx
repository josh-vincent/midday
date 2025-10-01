"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { useToast } from "@midday/ui/use-toast";
import { ArrowUpRight, ArrowDownRight, CreditCard, ShoppingCart, Repeat, AlertCircle } from "lucide-react";

// Components
import { TransactionsDataTable } from "@/components/tables/transactions/data-table";
import { TransactionsHeader } from "@/components/transactions-header";
import { TransactionSheet } from "@/components/sheets/transaction-sheet";
import { TransactionStats } from "@/components/transactions/transaction-stats";
import { TransactionCreateSheet } from "@/components/sheets/transaction-create-sheet";
import { TransactionImportSheet } from "@/components/sheets/transaction-import-sheet";

// Mock data
import { transactionsAPI, type MockTransaction } from "@/lib/mock/transactions-mock";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  // State
  const [transactions, setTransactions] = useState<MockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  // Sheet states
  const [selectedTransaction, setSelectedTransaction] = useState<MockTransaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);
  const [showImportTransactions, setShowImportTransactions] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionsAPI.getTransactions();
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.account.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || transaction.category === categoryFilter;
    const matchesStatus = !statusFilter || transaction.status === statusFilter;
    const matchesDate = new Date(transaction.date) >= dateRange.from && 
                       new Date(transaction.date) <= dateRange.to;
    const matchesTab = activeTab === "all" || 
                       (activeTab === "income" && transaction.amount > 0) ||
                       (activeTab === "expenses" && transaction.amount < 0) ||
                       (activeTab === "recurring" && transaction.isRecurring) ||
                       (activeTab === "pending" && transaction.status === "pending");
    
    return matchesSearch && matchesCategory && matchesStatus && matchesDate && matchesTab;
  });

  // Calculate stats
  const stats = {
    totalIncome: transactions
      .filter(t => t.amount > 0 && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: transactions
      .filter(t => t.amount < 0 && t.status === "completed")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    pendingCount: transactions.filter(t => t.status === "pending").length,
    recurringCount: transactions.filter(t => t.isRecurring).length,
  };

  // Event handlers
  const handleTransactionClick = (transaction: MockTransaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleEditTransaction = (transaction: MockTransaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleDeleteTransaction = async (transaction: MockTransaction) => {
    try {
      await transactionsAPI.deleteTransaction(transaction.id);
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully",
      });
      await loadTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const handleCategorizeTransaction = async (transaction: MockTransaction, category: string) => {
    try {
      await transactionsAPI.updateTransaction(transaction.id, { category });
      toast({
        title: "Transaction categorized",
        description: `Transaction has been categorized as ${category}`,
      });
      await loadTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to categorize transaction",
        variant: "destructive",
      });
    }
  };

  const handleCreateTransaction = async (data: any) => {
    try {
      await transactionsAPI.createTransaction(data);
      toast({
        title: "Transaction created",
        description: "The transaction has been created successfully",
      });
      setShowCreateTransaction(false);
      await loadTransactions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      });
    }
  };

  const handleImportTransactions = async (file: File) => {
    try {
      // Mock import
      toast({
        title: "Import started",
        description: "Your transactions are being imported",
      });
      setShowImportTransactions(false);
      setTimeout(() => {
        loadTransactions();
        toast({
          title: "Import complete",
          description: "12 transactions have been imported successfully",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import transactions",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your transactions are being exported",
    });
  };

  const handleRefresh = () => {
    loadTransactions();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <TransactionsHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onCreateTransaction={() => setShowCreateTransaction(true)}
        onImportTransactions={() => setShowImportTransactions(true)}
        onExport={handleExport}
        onRefresh={handleRefresh}
        isRefreshing={loading}
        totalTransactions={transactions.length}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Income
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${stats.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Expenses
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${stats.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Pending
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pendingCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Transactions pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Recurring
              <Repeat className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.recurringCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Recurring transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="recurring">Recurring</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-6">
          <TransactionsDataTable
            data={filteredTransactions}
            loading={loading}
            hasFilters={!!searchQuery || !!categoryFilter || !!statusFilter}
            onTransactionClick={handleTransactionClick}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onCategorizeTransaction={handleCategorizeTransaction}
          />

          {activeTab === "all" && (
            <TransactionStats transactions={transactions} />
          )}
        </TabsContent>
      </Tabs>

      {/* Sheet Components */}
      <TransactionSheet
        transaction={selectedTransaction}
        open={showTransactionDetails}
        onOpenChange={setShowTransactionDetails}
        onEdit={(transaction) => {
          // Handle edit
          toast({
            title: "Edit transaction",
            description: "Transaction editing will be implemented",
          });
        }}
        onDelete={handleDeleteTransaction}
      />

      <TransactionCreateSheet
        open={showCreateTransaction}
        onOpenChange={setShowCreateTransaction}
        onCreate={handleCreateTransaction}
      />

      <TransactionImportSheet
        open={showImportTransactions}
        onOpenChange={setShowImportTransactions}
        onImport={handleImportTransactions}
      />
    </div>
  );
}