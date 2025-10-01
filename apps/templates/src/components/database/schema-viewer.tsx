"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@midday/ui/card";
import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { ScrollArea } from "@midday/ui/scroll-area";
import { 
  Table, 
  Key, 
  Link, 
  ChevronDown, 
  ChevronRight,
  Search,
  Database,
  Hash
} from "lucide-react";
import { databaseAPI, type MockTable } from "@/lib/mock/database-mock";

export function SchemaViewer() {
  const [tables, setTables] = useState<MockTable[]>([]);
  const [expandedTables, setExpandedTables] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const data = await databaseAPI.getTables();
      setTables(data);
    } finally {
      setLoading(false);
    }
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev =>
      prev.includes(tableName)
        ? prev.filter(t => t !== tableName)
        : [...prev, tableName]
    );
  };

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.columns.some(col => col.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getColumnTypeColor = (type: string) => {
    if (type.includes("uuid")) return "text-purple-500";
    if (type.includes("varchar") || type.includes("text")) return "text-blue-500";
    if (type.includes("int") || type.includes("decimal")) return "text-green-500";
    if (type.includes("timestamp") || type.includes("date")) return "text-yellow-500";
    if (type.includes("jsonb") || type.includes("json")) return "text-orange-500";
    return "text-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Database Schema</CardTitle>
          <CardDescription>
            Explore tables, columns, and relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tables or columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tables List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTables.map((table) => {
          const isExpanded = expandedTables.includes(table.name);
          
          return (
            <Card key={table.name}>
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleTable(table.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Table className="h-5 w-5" />
                    <div>
                      <CardTitle>{table.name}</CardTitle>
                      <CardDescription>
                        {table.columns.length} columns • {table.rowCount.toLocaleString()} rows • {table.sizeInMB} MB
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {/* Columns */}
                      <div className="space-y-1">
                        {table.columns.map((column) => (
                          <div
                            key={column.name}
                            className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                {column.isPrimaryKey && (
                                  <Key className="h-3 w-3 text-yellow-500" />
                                )}
                                {column.isForeignKey && (
                                  <Link className="h-3 w-3 text-blue-500" />
                                )}
                                {column.isUnique && !column.isPrimaryKey && (
                                  <Hash className="h-3 w-3 text-purple-500" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{column.name}</p>
                                <p className={`text-xs ${getColumnTypeColor(column.type)}`}>
                                  {column.type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!column.nullable && (
                                <Badge variant="outline" className="text-xs">
                                  NOT NULL
                                </Badge>
                              )}
                              {column.default && (
                                <Badge variant="secondary" className="text-xs">
                                  {column.default}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Foreign Keys */}
                      {table.foreignKeys.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-2">Foreign Keys</h4>
                          <div className="space-y-2">
                            {table.foreignKeys.map((fk, idx) => (
                              <div key={idx} className="text-sm p-2 bg-muted/50 rounded">
                                <div className="flex items-center space-x-2">
                                  <Link className="h-3 w-3 text-blue-500" />
                                  <span>{fk.column}</span>
                                  <span className="text-muted-foreground">→</span>
                                  <span className="font-medium">{fk.referencedTable}.{fk.referencedColumn}</span>
                                </div>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                                  <span>ON DELETE: {fk.onDelete}</span>
                                  <span>ON UPDATE: {fk.onUpdate}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Indexes */}
                      {table.indexes.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-2">Indexes</h4>
                          <div className="space-y-2">
                            {table.indexes.map((index) => (
                              <div key={index.name} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                                <div className="flex items-center space-x-2">
                                  <Database className="h-3 w-3 text-gray-500" />
                                  <span className="font-mono text-xs">{index.name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {index.type}
                                  </Badge>
                                  {index.unique && (
                                    <Badge variant="secondary" className="text-xs">
                                      UNIQUE
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}