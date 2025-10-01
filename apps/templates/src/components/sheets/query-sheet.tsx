"use client";

import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { ScrollArea } from "@midday/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@midday/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { useToast } from "@midday/ui/use-toast";
import { Play, Download, History, Database } from "lucide-react";
import { useState } from "react";
import { databaseAPI } from "@/lib/mock/database-mock";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
};

export function QuerySheet({ open, onOpenChange, initialQuery = "" }: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number>();
  const [queryHistory, setQueryHistory] = useState<string[]>([
    "SELECT * FROM users LIMIT 10;",
    "SELECT COUNT(*) FROM invoices WHERE status = 'paid';",
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
  ]);

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Please enter a query",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const data = await databaseAPI.executeQuery(query);
      const endTime = Date.now();
      
      setResults(data);
      setExecutionTime(endTime - startTime);
      
      // Add to query history
      if (!queryHistory.includes(query)) {
        setQueryHistory(prev => [query, ...prev.slice(0, 9)]); // Keep last 10 queries
      }

      toast({
        title: `Query executed successfully (${endTime - startTime}ms)`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Query execution failed",
        description: "Check your SQL syntax and try again",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportResults = () => {
    if (results.length === 0) {
      toast({
        title: "No results to export",
        variant: "destructive",
      });
      return;
    }

    const csv = [
      Object.keys(results[0]).join(","),
      ...results.map(row => Object.values(row).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "query-results.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Results exported successfully",
      variant: "success",
    });
  };

  const commonQueries = [
    {
      name: "List all tables",
      query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    },
    {
      name: "Show table structure",
      query: "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users';"
    },
    {
      name: "Count all rows",
      query: "SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables;"
    },
    {
      name: "Database size",
      query: "SELECT pg_size_pretty(pg_database_size(current_database()));"
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[900px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center space-x-3">
            <Database className="h-5 w-5 text-blue-500" />
            <div>
              <SheetTitle>SQL Query Builder</SheetTitle>
              <SheetDescription>
                Execute SQL queries against your database
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Tabs defaultValue="query" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="query">Query</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="query" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sql-query">SQL Query</Label>
                <textarea
                  id="sql-query"
                  className="min-h-[150px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter your SQL query here..."
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleExecuteQuery}
                  disabled={isExecuting || !query.trim()}
                  className="flex-1"
                >
                  {isExecuting ? (
                    <>
                      <Play className="h-4 w-4 mr-2 animate-pulse" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Execute Query
                    </>
                  )}
                </Button>

                {results.length > 0 && (
                  <Button 
                    onClick={handleExportResults}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                )}
              </div>

              {executionTime && (
                <div className="text-sm text-muted-foreground">
                  Query executed in {executionTime}ms • {results.length} rows returned
                </div>
              )}

              {results.length > 0 && (
                <div>
                  <Label>Results</Label>
                  <ScrollArea className="h-[300px] w-full rounded-md border mt-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(results[0]).map((key) => (
                            <TableHead key={key} className="font-mono text-xs">
                              {key}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value, cellIndex) => (
                              <TableCell key={cellIndex} className="font-mono text-xs">
                                {String(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div>
                <Label>Query History</Label>
                <ScrollArea className="h-[400px] w-full rounded-md border mt-2">
                  <div className="p-4 space-y-2">
                    {queryHistory.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No query history yet
                      </div>
                    ) : (
                      queryHistory.map((historyQuery, index) => (
                        <div
                          key={index}
                          className="p-3 border rounded cursor-pointer hover:bg-muted/50"
                          onClick={() => setQuery(historyQuery)}
                        >
                          <code className="text-sm font-mono text-muted-foreground">
                            {historyQuery}
                          </code>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div>
                <Label>Common Queries</Label>
                <ScrollArea className="h-[400px] w-full rounded-md border mt-2">
                  <div className="p-4 space-y-2">
                    {commonQueries.map((template, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded cursor-pointer hover:bg-muted/50"
                        onClick={() => setQuery(template.query)}
                      >
                        <div className="font-medium text-sm mb-1">
                          {template.name}
                        </div>
                        <code className="text-xs font-mono text-muted-foreground">
                          {template.query}
                        </code>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}