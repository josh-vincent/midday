"use client";

import { useState } from "react";
import { Button } from "@midday/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@midday/ui/sheet";
import { Input } from "@midday/ui/input";
import { Label } from "@midday/ui/label";
import { Textarea } from "@midday/ui/textarea";
import { Alert, AlertDescription } from "@midday/ui/alert";
import { 
  Upload, 
  FileText, 
  Download, 
  Info,
  Loader2 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";

interface CustomerImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: (data: any) => Promise<void>;
}

export function CustomerImportSheet({
  open,
  onOpenChange,
  onImport,
}: CustomerImportSheetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [importTab, setImportTab] = useState("upload");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!onImport) return;
    
    setIsLoading(true);
    try {
      if (importTab === "upload" && file) {
        const text = await file.text();
        await onImport({ type: "file", data: text });
      } else if (importTab === "paste" && csvText) {
        await onImport({ type: "text", data: csvText });
      }
      onOpenChange(false);
      setFile(null);
      setCsvText("");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `Name,Email,Phone,Company,Address,City,State,ZIP,Country,Type,Status
John Doe,john@example.com,+1234567890,Acme Inc,123 Main St,New York,NY,10001,USA,individual,active
Jane Smith,jane@example.com,+0987654321,Tech Corp,456 Oak Ave,San Francisco,CA,94102,USA,company,active`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[550px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import Customers</SheetTitle>
          <SheetDescription>
            Import multiple customers from a CSV file or paste data directly.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Import customers in bulk using CSV format. Download our template to see the required format.
            </AlertDescription>
          </Alert>

          <div>
            <Button
              variant="outline"
              className="w-full"
              onClick={downloadTemplate}
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          <Tabs value={importTab} onValueChange={setImportTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="paste">Paste Data</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">CSV File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                </div>
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {file.name} ({Math.round(file.size / 1024)} KB)
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="paste" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-text">CSV Data</Label>
                <Textarea
                  id="csv-text"
                  placeholder="Paste your CSV data here...
Name,Email,Phone,Company
John Doe,john@example.com,+1234567890,Acme Inc"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="h-[200px] font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Import Guidelines</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• CSV must include headers in the first row</li>
              <li>• Required fields: Name and Email</li>
              <li>• Optional fields: Phone, Company, Address, City, State, ZIP, Country</li>
              <li>• Type values: "individual" or "company"</li>
              <li>• Status values: "active" or "inactive"</li>
              <li>• Maximum 1000 customers per import</li>
            </ul>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              isLoading || 
              (importTab === "upload" && !file) || 
              (importTab === "paste" && !csvText)
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="mr-2 h-4 w-4" />
            Import Customers
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}