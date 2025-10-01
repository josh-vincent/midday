"use client";

import { Badge } from "@midday/ui/badge";
import { Button } from "@midday/ui/button";
import { ScrollArea } from "@midday/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { Table, Key, Link, Hash, Database } from "lucide-react";
import type { MockTable } from "@/lib/mock/database-mock";

type Props = {
  table: MockTable | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TableDetailsSheet({ table, open, onOpenChange }: Props) {
  const getColumnTypeColor = (type: string) => {
    if (type.includes("uuid")) return "text-purple-500";
    if (type.includes("varchar") || type.includes("text")) return "text-blue-500";
    if (type.includes("int") || type.includes("decimal")) return "text-green-500";
    if (type.includes("timestamp") || type.includes("date")) return "text-yellow-500";
    if (type.includes("jsonb") || type.includes("json")) return "text-orange-500";
    return "text-gray-500";
  };

  if (!table) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center space-x-3">
            <Table className="h-5 w-5 text-blue-500" />
            <div>
              <SheetTitle>{table.name}</SheetTitle>
              <SheetDescription>
                {table.schema} • {table.columns.length} columns • {table.rowCount.toLocaleString()} rows • {table.sizeInMB} MB
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="columns" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="columns">Columns</TabsTrigger>
            <TabsTrigger value="indexes">Indexes</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>

          <TabsContent value="columns" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {table.columns.map((column) => (
                  <div
                    key={column.name}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
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
            </ScrollArea>
          </TabsContent>

          <TabsContent value="indexes" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {table.indexes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No indexes found
                  </div>
                ) : (
                  table.indexes.map((index) => (
                    <div
                      key={index.name}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Database className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium text-sm">{index.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {index.columns.join(", ")}
                          </p>
                        </div>
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
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="relationships" className="mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {table.foreignKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No foreign key relationships found
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Foreign Keys</h4>
                      <div className="space-y-2">
                        {table.foreignKeys.map((fk, idx) => (
                          <div key={idx} className="p-3 border rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <Link className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-sm">{fk.column}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium text-sm">{fk.referencedTable}.{fk.referencedColumn}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>ON DELETE: {fk.onDelete}</span>
                              <span>ON UPDATE: {fk.onUpdate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 mt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Close
          </Button>
          <Button className="flex-1">
            Export Schema
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}