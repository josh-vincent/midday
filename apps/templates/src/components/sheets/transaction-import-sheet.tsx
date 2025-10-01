"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { cn } from "@midday/ui/cn";
import { Upload, FileText, Check, X, AlertCircle } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File) => void;
};

export function TransactionImportSheet({ open, onOpenChange, onImport }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [account, setAccount] = useState("");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "text/csv" || droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (file && account) {
      onImport(file);
      setFile(null);
      setAccount("");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px]">
        <SheetHeader>
          <SheetTitle>Import Transactions</SheetTitle>
          <SheetDescription>
            Upload a CSV file to import your bank transactions
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload File</Label>
            <div
              className={cn(
                "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-border",
                file && "border-green-500 bg-green-50 dark:bg-green-950/20"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {file ? (
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports CSV files up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Account Selection */}
          <div className="space-y-2">
            <Label htmlFor="account">Import to Account</Label>
            <Select value={account} onValueChange={setAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business-checking">Business Checking</SelectItem>
                <SelectItem value="business-savings">Business Savings</SelectItem>
                <SelectItem value="corporate-card">Corporate Card</SelectItem>
                <SelectItem value="petty-cash">Petty Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Help Text */}
          <div className="rounded-lg bg-muted p-4">
            <div className="flex space-x-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium">CSV Format Requirements</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Date, Description, Amount (required columns)</li>
                  <li>• Category, Reference (optional columns)</li>
                  <li>• Amounts: negative for expenses, positive for income</li>
                  <li>• UTF-8 encoding recommended</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sample Data */}
          <div className="space-y-2">
            <Label>Sample Format</Label>
            <div className="rounded-lg bg-muted/50 p-3 overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Date</th>
                    <th className="text-left p-1">Description</th>
                    <th className="text-left p-1">Amount</th>
                    <th className="text-left p-1">Category</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-1">01/15/2024</td>
                    <td className="p-1">Office Supplies</td>
                    <td className="p-1">-125.50</td>
                    <td className="p-1">Supplies</td>
                  </tr>
                  <tr>
                    <td className="p-1">01/16/2024</td>
                    <td className="p-1">Client Payment</td>
                    <td className="p-1">5000.00</td>
                    <td className="p-1">Income</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!file || !account}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Transactions
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}