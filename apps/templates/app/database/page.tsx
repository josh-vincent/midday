"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Database, Table, Key, Link, FileCode } from "lucide-react";
import { useToast } from "@midday/ui/use-toast";

// New components
import { DatabaseTablesDataTable } from "@/components/tables/database-tables/data-table";
import { MigrationsDataTable } from "@/components/tables/migrations/data-table";
import { DatabaseTablesHeader } from "@/components/database-tables-header";
import { MigrationsHeader } from "@/components/migrations-header";
import { TableDetailsSheet } from "@/components/sheets/table-details-sheet";
import { MigrationSheet } from "@/components/sheets/migration-sheet";
import { QuerySheet } from "@/components/sheets/query-sheet";
import { DatabaseStats } from "@/components/database/database-stats";

// Mock data
import { databaseAPI, type MockTable, type MockMigration } from "@/lib/mock/database-mock";

export default function DatabasePage() {
  const [activeTab, setActiveTab] = useState("tables");
  const { toast } = useToast();

  // Tables state
  const [tables, setTables] = useState<MockTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesSearchQuery, setTablesSearchQuery] = useState("");
  const [tablesSchemaFilter, setTablesSchemaFilter] = useState("");

  // Migrations state
  const [migrations, setMigrations] = useState<MockMigration[]>([]);
  const [migrationsLoading, setMigrationsLoading] = useState(true);
  const [migrationsSearchQuery, setMigrationsSearchQuery] = useState("");
  const [migrationsStatusFilter, setMigrationsStatusFilter] = useState("");

  // Sheet states
  const [selectedTable, setSelectedTable] = useState<MockTable | null>(null);
  const [selectedMigration, setSelectedMigration] = useState<MockMigration | null>(null);
  const [showTableDetails, setShowTableDetails] = useState(false);
  const [showMigrationDetails, setShowMigrationDetails] = useState(false);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  useEffect(() => {
    loadTables();
    loadMigrations();
  }, []);

  const loadTables = async () => {
    try {
      setTablesLoading(true);
      const data = await databaseAPI.getTables();
      setTables(data);
    } finally {
      setTablesLoading(false);
    }
  };

  const loadMigrations = async () => {
    try {
      setMigrationsLoading(true);
      const data = await databaseAPI.getMigrations();
      setMigrations(data);
    } finally {
      setMigrationsLoading(false);
    }
  };

  // Filter functions
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(tablesSearchQuery.toLowerCase()) ||
                         table.columns.some(col => col.name.toLowerCase().includes(tablesSearchQuery.toLowerCase()));
    const matchesSchema = !tablesSchemaFilter || table.schema === tablesSchemaFilter;
    return matchesSearch && matchesSchema;
  });

  const filteredMigrations = migrations.filter(migration => {
    const matchesSearch = migration.name.toLowerCase().includes(migrationsSearchQuery.toLowerCase()) ||
                         migration.id.toLowerCase().includes(migrationsSearchQuery.toLowerCase());
    const matchesStatus = !migrationsStatusFilter || migration.status === migrationsStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Event handlers
  const handleTableClick = (table: MockTable) => {
    setSelectedTable(table);
    setShowTableDetails(true);
  };

  const handleViewTableDetails = (table: MockTable) => {
    setSelectedTable(table);
    setShowTableDetails(true);
  };

  const handleExportData = (table: MockTable) => {
    toast({
      title: `Exporting data from ${table.name}`,
      description: "Download will start shortly",
    });
  };

  const handleAnalyzeTable = (table: MockTable) => {
    toast({
      title: `Analyzing table ${table.name}`,
      description: "Analysis results will be available soon",
    });
  };

  const handleMigrationClick = (migration: MockMigration) => {
    setSelectedMigration(migration);
    setShowMigrationDetails(true);
  };

  const handleViewMigrationDetails = (migration: MockMigration) => {
    setSelectedMigration(migration);
    setShowMigrationDetails(true);
  };

  const handleRunMigration = (migration: MockMigration) => {
    toast({
      title: `Running migration ${migration.name}`,
      description: "Migration execution started",
    });
  };

  const handleRollbackMigration = (migration: MockMigration) => {
    toast({
      title: `Rolling back migration ${migration.name}`,
      description: "Rollback started",
    });
  };

  const handleSQLQuery = (query?: string) => {
    if (query) {
      setInitialQuery(query);
    }
    setShowQueryBuilder(true);
  };

  // Calculate stats
  const stats = {
    tables: tables.length,
    views: 8, // Mock data
    functions: 15, // Mock data
    indexes: tables.reduce((acc, table) => acc + table.indexes.length, 0),
    relations: tables.reduce((acc, table) => acc + table.foreignKeys.length, 0),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Database Management</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive database schema viewer, migration management, and performance monitoring
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Table className="h-4 w-4 text-blue-500" />
              <span className="text-2xl font-bold">{stats.tables}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-green-500" />
              <span className="text-2xl font-bold">{stats.views}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <FileCode className="h-4 w-4 text-purple-500" />
              <span className="text-2xl font-bold">{stats.functions}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Indexes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Key className="h-4 w-4 text-yellow-500" />
              <span className="text-2xl font-bold">{stats.indexes}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Relations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Link className="h-4 w-4 text-indigo-500" />
              <span className="text-2xl font-bold">{stats.relations}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
          <TabsTrigger value="query">Query Builder</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="mt-6 space-y-6">
          <DatabaseTablesHeader
            searchQuery={tablesSearchQuery}
            onSearchChange={setTablesSearchQuery}
            onRefresh={loadTables}
            onSQLQuery={() => handleSQLQuery()}
            schemaFilter={tablesSchemaFilter}
            onSchemaFilterChange={setTablesSchemaFilter}
            totalTables={tables.length}
            isRefreshing={tablesLoading}
          />
          
          <DatabaseTablesDataTable
            data={filteredTables}
            loading={tablesLoading}
            hasFilters={!!tablesSearchQuery || !!tablesSchemaFilter}
            onTableClick={handleTableClick}
            onViewDetails={handleViewTableDetails}
            onExportData={handleExportData}
            onAnalyzeTable={handleAnalyzeTable}
          />
        </TabsContent>

        <TabsContent value="migrations" className="mt-6 space-y-6">
          <MigrationsHeader
            searchQuery={migrationsSearchQuery}
            onSearchChange={setMigrationsSearchQuery}
            onRefresh={loadMigrations}
            statusFilter={migrationsStatusFilter}
            onStatusFilterChange={setMigrationsStatusFilter}
            migrations={migrations}
            isRefreshing={migrationsLoading}
          />
          
          <MigrationsDataTable
            data={filteredMigrations}
            loading={migrationsLoading}
            hasFilters={!!migrationsSearchQuery || !!migrationsStatusFilter}
            onMigrationClick={handleMigrationClick}
            onViewDetails={handleViewMigrationDetails}
            onRunMigration={handleRunMigration}
            onRollbackMigration={handleRollbackMigration}
          />
        </TabsContent>

        <TabsContent value="query" className="mt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Open the SQL Query Builder to execute custom queries</p>
              <button
                onClick={() => handleSQLQuery()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Open Query Builder
              </button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <DatabaseStats />
        </TabsContent>
      </Tabs>

      {/* Sheet Components */}
      <TableDetailsSheet
        table={selectedTable}
        open={showTableDetails}
        onOpenChange={setShowTableDetails}
      />

      <MigrationSheet
        migration={selectedMigration}
        open={showMigrationDetails}
        onOpenChange={setShowMigrationDetails}
        onRunMigration={handleRunMigration}
        onRollbackMigration={handleRollbackMigration}
      />

      <QuerySheet
        open={showQueryBuilder}
        onOpenChange={setShowQueryBuilder}
        initialQuery={initialQuery}
      />
    </div>
  );
}