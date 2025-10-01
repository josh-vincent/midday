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
import { useToast } from "@midday/ui/use-toast";
import { Clock, CheckCircle, XCircle, AlertCircle, Play, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type { MockMigration } from "@/lib/mock/database-mock";

type Props = {
  migration: MockMigration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRunMigration?: (migration: MockMigration) => void;
  onRollbackMigration?: (migration: MockMigration) => void;
};

export function MigrationSheet({ 
  migration, 
  open, 
  onOpenChange,
  onRunMigration,
  onRollbackMigration
}: Props) {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "applied":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "text-green-600 bg-green-50 border-green-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const handleRunMigration = async () => {
    if (!migration) return;
    
    setIsRunning(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      onRunMigration?.(migration);
      toast({
        title: "Migration executed successfully",
        variant: "success",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to execute migration",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRollbackMigration = async () => {
    if (!migration) return;
    
    setIsRollingBack(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      onRollbackMigration?.(migration);
      toast({
        title: "Migration rolled back successfully",
        variant: "success",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to rollback migration",
        variant: "destructive",
      });
    } finally {
      setIsRollingBack(false);
    }
  };

  if (!migration) return null;

  // Mock SQL content for demonstration
  const mockSql = `-- Migration: ${migration.name}
-- Version: ${migration.version}
-- Checksum: ${migration.checksum}

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS users_created_at_idx ON users(created_at);

-- Add RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center space-x-3">
            {getStatusIcon(migration.status)}
            <div>
              <SheetTitle>{migration.name}</SheetTitle>
              <SheetDescription>
                Migration {migration.id} • Version {migration.version}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status and Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(migration.status)}>
                    {migration.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Version</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {migration.version}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Checksum</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {migration.checksum}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Applied At</label>
                <p className="text-sm text-muted-foreground">
                  {migration.status === "pending" 
                    ? "Not applied yet" 
                    : formatDistanceToNow(migration.appliedAt, { addSuffix: true })
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Execution Time</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {migration.status === "pending" 
                    ? "-" 
                    : `${migration.executionTime}ms`
                  }
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Migration ID</label>
                <p className="text-sm text-muted-foreground font-mono">
                  {migration.id}
                </p>
              </div>
            </div>
          </div>

          {/* SQL Content */}
          <div>
            <label className="text-sm font-medium">SQL Content</label>
            <ScrollArea className="h-[300px] w-full rounded-md border mt-2">
              <pre className="p-4 text-xs">
                <code className="text-muted-foreground">
                  {mockSql}
                </code>
              </pre>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Close
            </Button>

            {migration.status === "pending" && (
              <Button 
                onClick={handleRunMigration}
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Migration
                  </>
                )}
              </Button>
            )}

            {migration.status === "applied" && (
              <Button 
                onClick={handleRollbackMigration}
                disabled={isRollingBack}
                variant="destructive"
                className="flex-1"
              >
                {isRollingBack ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Rolling back...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Rollback
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}