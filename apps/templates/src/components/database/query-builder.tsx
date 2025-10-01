"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Textarea } from "@midday/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { Badge } from "@midday/ui/badge";
import { ScrollArea } from "@midday/ui/scroll-area";
import { 
  Play, 
  Save, 
  History, 
  Database, 
  Table, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw
} from "lucide-react";
import { databaseAPI } from "@/lib/mock/database-mock";

interface QueryResult {
  id: string;
  query: string;
  status: "success" | "error" | "running";
  results?: any[];
  error?: string;
  executionTime: number;
  timestamp: Date;
  rowsAffected?: number;
}

export function QueryBuilder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedTable, setSelectedTable] = useState("");
  const [queryHistory, setQueryHistory] = useState<string[]>([
    "SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days'",
    "SELECT COUNT(*) FROM invoices GROUP BY status",
    "SELECT u.email, COUNT(i.id) as invoice_count FROM users u LEFT JOIN invoices i ON u.id = i.customer_id GROUP BY u.id",
    "SELECT * FROM customers WHERE metadata->>'type' = 'premium'",
  ]);

  const tables = ["users", "teams", "invoices", "customers"];
  const commonQueries = [
    { name: "Select all users", query: "SELECT * FROM users LIMIT 10" },
    { name: "Count by status", query: "SELECT status, COUNT(*) FROM invoices GROUP BY status" },
    { name: "Recent invoices", query: "SELECT * FROM invoices WHERE created_at > NOW() - INTERVAL '7 days'" },
    { name: "Premium customers", query: "SELECT * FROM customers WHERE metadata->>'type' = 'premium'" },
  ];

  const executeQuery = async () => {
    if (!query.trim()) return;

    setIsExecuting(true);
    const queryId = Date.now().toString();
    const startTime = Date.now();

    // Add to running results
    const newResult: QueryResult = {
      id: queryId,
      query,
      status: "running",
      executionTime: 0,
      timestamp: new Date(),
    };

    setResults(prev => [newResult, ...prev]);

    try {
      const data = await databaseAPI.executeQuery(query);
      const executionTime = Date.now() - startTime;

      setResults(prev =>
        prev.map(result =>
          result.id === queryId
            ? {
                ...result,
                status: "success" as const,
                results: data,
                executionTime,
                rowsAffected: data.length,
              }
            : result
        )
      );

      // Add to history if not already there
      if (!queryHistory.includes(query)) {
        setQueryHistory(prev => [query, ...prev.slice(0, 9)]);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      setResults(prev =>
        prev.map(result =>
          result.id === queryId
            ? {
                ...result,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Unknown error",
                executionTime,
              }
            : result
        )
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const insertTemplate = (template: string) => {
    setQuery(template);
  };

  const clearResults = () => {
    setResults([]);
  };

  const formatQuery = () => {
    // Simple query formatting
    const formatted = query
      .replace(/\bSELECT\b/gi, "SELECT")
      .replace(/\bFROM\b/gi, "\nFROM")
      .replace(/\bWHERE\b/gi, "\nWHERE")
      .replace(/\bGROUP BY\b/gi, "\nGROUP BY")
      .replace(/\bORDER BY\b/gi, "\nORDER BY")
      .replace(/\bLIMIT\b/gi, "\nLIMIT");
    setQuery(formatted);
  };

  return (
    <div className="space-y-6">
      {/* Query Builder */}
      <Card>
        <CardHeader>
          <CardTitle>SQL Query Builder</CardTitle>
          <CardDescription>
            Execute SQL queries and explore your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table} value={table}>
                      <div className="flex items-center space-x-2">
                        <Table className="h-4 w-4" />
                        <span>{table}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => insertTemplate(`SELECT * FROM ${selectedTable} LIMIT 10`)}
                >
                  Select All
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={formatQuery}>
                Format
              </Button>
              <Button variant="outline" size="sm" onClick={clearResults}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>

          {/* Query Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Enter your SQL query here..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button onClick={executeQuery} disabled={isExecuting || !query.trim()}>
                  {isExecuting ? (
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isExecuting ? "Executing..." : "Execute"}
                </Button>
                <Button variant="outline" disabled={!query.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Press Ctrl+Enter to execute
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>
            Common queries to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {commonQueries.map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="justify-start h-auto p-3"
                onClick={() => insertTemplate(template.query)}
              >
                <div className="text-left">
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {template.query.substring(0, 40)}...
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Query Results</CardTitle>
                  <CardDescription>
                    {results.length > 0 ? `${results.length} query(s) executed` : "No queries executed yet"}
                  </CardDescription>
                </div>
                {results.length > 0 && (
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {results.map((result) => (
                    <div key={result.id} className="border rounded-lg">
                      <div className="flex items-center justify-between p-3 border-b">
                        <div className="flex items-center space-x-2">
                          {result.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {result.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                          {result.status === "running" && <RotateCcw className="h-4 w-4 text-blue-500 animate-spin" />}
                          <Badge variant={result.status === "success" ? "default" : result.status === "error" ? "destructive" : "secondary"}>
                            {result.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{result.executionTime}ms</span>
                          </div>
                          {result.rowsAffected !== undefined && (
                            <span>{result.rowsAffected} rows</span>
                          )}
                          <span>{result.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <div className="bg-muted p-2 rounded text-sm font-mono mb-3">
                          {result.query}
                        </div>
                        
                        {result.status === "success" && result.results && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  {Object.keys(result.results[0] || {}).map((key) => (
                                    <th key={key} className="text-left p-2 font-medium">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {result.results.map((row, idx) => (
                                  <tr key={idx} className="border-b">
                                    {Object.values(row).map((value, valueIdx) => (
                                      <td key={valueIdx} className="p-2">
                                        {String(value)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        
                        {result.status === "error" && result.error && (
                          <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                            {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Query History */}
        <Card>
          <CardHeader>
            <CardTitle>Query History</CardTitle>
            <CardDescription>
              Recently executed queries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {queryHistory.map((historyQuery, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded cursor-pointer hover:bg-muted/50"
                    onClick={() => setQuery(historyQuery)}
                  >
                    <div className="flex items-start space-x-2">
                      <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-mono text-xs leading-relaxed">
                          {historyQuery}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}