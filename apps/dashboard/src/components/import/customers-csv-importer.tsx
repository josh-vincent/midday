"use client";

import { useTRPC } from "@/trpc/client";
import { Alert, AlertDescription } from "@midday/ui/alert";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, Upload, Users } from "lucide-react";
import { useState } from "react";
import { CSVUploader } from "./csv-uploader";

interface CustomersCSVImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CustomerImportData {
  name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  contactPerson?: string;
  abn?: string; // Australian Business Number
  notes?: string;
}

const FIELD_OPTIONS = [
  { value: "name", label: "Company Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "website", label: "Website" },
  { value: "address", label: "Address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "postalCode", label: "Postal Code" },
  { value: "country", label: "Country" },
  { value: "contactPerson", label: "Contact Person" },
  { value: "abn", label: "ABN" },
  { value: "notes", label: "Notes" },
];

export function CustomersCSVImporter({
  open,
  onOpenChange,
}: CustomersCSVImporterProps) {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<CustomerImportData[]>([]);
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [importing, setImporting] = useState(false);

  const { toast } = useToast();
  const trpc = useTRPC();

  // Customers bulk import mutation
  const customersImportMutation = useMutation(
    trpc.customers.bulkImport.mutationOptions({
      onSuccess: (data) => {
        toast({
          title: "Import successful",
          description: `Imported ${data.length} customers successfully`,
        });
        onOpenChange(false);
        resetState();
      },
      onError: (error) => {
        toast({
          title: "Import failed",
          description: error.message,
          variant: "destructive",
        });
        setImporting(false);
      },
    }),
  );

  const resetState = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setMappings({});
    setPreview([]);
    setStep("upload");
    setImporting(false);
  };

  const handleCSVUpload = (result: any) => {
    if (result.data && result.data.length > 0) {
      setCsvData(result.data);
      setCsvHeaders(Object.keys(result.data[0]));

      // Auto-detect mappings based on column names
      const autoMappings: Record<string, string> = {};
      const headers = Object.keys(result.data[0]);

      headers.forEach((header) => {
        const normalized = header.toLowerCase().replace(/[\s_-]/g, "");

        if (
          normalized.includes("company") ||
          (normalized.includes("name") && !normalized.includes("contact"))
        ) {
          autoMappings[header] = "name";
        } else if (normalized.includes("email")) {
          autoMappings[header] = "email";
        } else if (
          normalized.includes("phone") ||
          normalized.includes("mobile")
        ) {
          autoMappings[header] = "phone";
        } else if (
          normalized.includes("website") ||
          normalized.includes("url")
        ) {
          autoMappings[header] = "website";
        } else if (
          normalized.includes("address") ||
          normalized.includes("street")
        ) {
          autoMappings[header] = "address";
        } else if (
          normalized.includes("city") ||
          normalized.includes("suburb")
        ) {
          autoMappings[header] = "city";
        } else if (normalized.includes("state")) {
          autoMappings[header] = "state";
        } else if (
          normalized.includes("postal") ||
          normalized.includes("postcode") ||
          normalized.includes("zip")
        ) {
          autoMappings[header] = "postalCode";
        } else if (normalized.includes("country")) {
          autoMappings[header] = "country";
        } else if (
          normalized.includes("contact") &&
          normalized.includes("person")
        ) {
          autoMappings[header] = "contactPerson";
        } else if (normalized.includes("abn")) {
          autoMappings[header] = "abn";
        } else if (
          normalized.includes("note") ||
          normalized.includes("comment")
        ) {
          autoMappings[header] = "notes";
        }
      });

      setMappings(autoMappings);
      setStep("mapping");
    }
  };

  const handleMappingChange = (csvColumn: string, field: string) => {
    setMappings((prev) => ({
      ...prev,
      [csvColumn]: field,
    }));
  };

  const generatePreview = () => {
    const previewData: CustomerImportData[] = csvData.map((row) => {
      const customer: CustomerImportData = {};

      Object.entries(mappings).forEach(([csvColumn, field]) => {
        const value = row[csvColumn];

        if (value !== undefined && value !== null && value !== "") {
          customer[field as keyof CustomerImportData] = value.toString().trim();
        }
      });

      return customer;
    });

    setPreview(previewData.slice(0, 5)); // Show first 5 for preview
    setStep("preview");
  };

  const handleImport = async () => {
    setImporting(true);

    const importData = csvData.map((row) => {
      const customer: any = {
        status: "active" as const,
      };

      Object.entries(mappings).forEach(([csvColumn, field]) => {
        const value = row[csvColumn];

        if (value !== undefined && value !== null && value !== "") {
          customer[field] = value.toString().trim();
        }
      });

      // Ensure we have at least a name
      if (!customer.name) {
        customer.name = "Unnamed Customer";
      }

      return customer;
    });

    try {
      await customersImportMutation.mutateAsync({ customers: importData });
    } catch (error) {
      console.error("Import error:", error);
      // Error handling is done in the mutation's onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">
            Import Customers from CSV
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <CSVUploader onUpload={handleCSVUpload} accept={[".csv"]} />

            <div className="rounded-lg bg-muted/50 p-6">
              <h4 className="mb-3 font-medium text-base">Expected Format:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Company Name, Email, Phone, Contact Person</li>
                <li>• Address, City, State, Postal Code, Country</li>
                <li>• ABN, Website, Notes</li>
                <li>• First row should contain column headers</li>
              </ul>
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-6 py-4">
            <Alert className="mb-6">
              <Users className="h-4 w-4" />
              <AlertDescription>
                Map your CSV columns to customer fields. We've auto-detected
                some mappings.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {csvHeaders.map((header) => (
                <div
                  key={header}
                  className="grid grid-cols-2 gap-6 items-center"
                >
                  <Label className="text-sm font-medium">{header}</Label>
                  <Select
                    value={mappings[header] || "skip"}
                    onValueChange={(value) =>
                      handleMappingChange(header, value === "skip" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Skip column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Skip column</SelectItem>
                      {FIELD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={generatePreview}>Preview Import</Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-6 py-4">
            <Alert className="mb-6">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Ready to import {csvData.length} customers. Preview of first 5
                below:
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3">Name</TableHead>
                    <TableHead className="py-3">Contact</TableHead>
                    <TableHead className="py-3">Email</TableHead>
                    <TableHead className="py-3">Phone</TableHead>
                    <TableHead className="py-3">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium py-3">
                        {customer.name}
                      </TableCell>
                      <TableCell className="py-3">
                        {customer.contactPerson}
                      </TableCell>
                      <TableCell className="py-3">{customer.email}</TableCell>
                      <TableCell className="py-3">{customer.phone}</TableCell>
                      <TableCell className="py-3">
                        {[customer.city, customer.state, customer.postalCode]
                          .filter(Boolean)
                          .join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>Importing...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {csvData.length} Customers
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
