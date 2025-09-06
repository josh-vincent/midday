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
import { parseDate } from "@midday/utils";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { CSVUploader } from "./csv-uploader";

interface JobsCSVImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
}

interface ColumnMapping {
  csvColumn: string;
  field: keyof JobImportData;
}

interface JobImportData {
  contactPerson?: string;
  contactNumber?: string;
  rego?: string;
  loadNumber?: number;
  companyName?: string;
  jobNumber?: string;
  addressSite?: string;
  equipmentType?: string;
  materialType?: string;
  pricePerUnit?: number;
  cubicMetreCapacity?: number;
  jobDate?: string;
}

const FIELD_OPTIONS = [
  { value: "contactPerson", label: "Contact Person" },
  { value: "contactNumber", label: "Contact Number" },
  { value: "rego", label: "Rego" },
  { value: "loadNumber", label: "Load Number" },
  { value: "companyName", label: "Company" },
  { value: "jobNumber", label: "Job Number" },
  { value: "addressSite", label: "Address/Site" },
  { value: "equipmentType", label: "Equipment" },
  { value: "materialType", label: "Material" },
  { value: "pricePerUnit", label: "Price" },
  { value: "cubicMetreCapacity", label: "Cubic Metres" },
  { value: "jobDate", label: "Date" },
];

export function JobsCSVImporter({
  open,
  onOpenChange,
  customerId,
}: JobsCSVImporterProps) {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<JobImportData[]>([]);
  const [step, setStep] = useState<"upload" | "mapping" | "preview">("upload");
  const [importing, setImporting] = useState(false);

  const { toast } = useToast();
  const trpc = useTRPC();

  // Jobs bulk import mutation
  const jobsImportMutation = useMutation(
    trpc.job.bulkImport.mutationOptions({
      onSuccess: (data) => {
        toast({
          title: "Import successful",
          description: `Imported ${data.length} jobs successfully`,
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

        if (normalized.includes("contact") && normalized.includes("person")) {
          autoMappings[header] = "contactPerson";
        } else if (
          normalized.includes("contact") &&
          (normalized.includes("number") || normalized.includes("phone"))
        ) {
          autoMappings[header] = "contactNumber";
        } else if (
          normalized.includes("rego") ||
          normalized.includes("registration")
        ) {
          autoMappings[header] = "rego";
        } else if (normalized.includes("load")) {
          autoMappings[header] = "loadNumber";
        } else if (normalized.includes("company")) {
          autoMappings[header] = "companyName";
        } else if (
          normalized.includes("job") &&
          normalized.includes("number")
        ) {
          autoMappings[header] = "jobNumber";
        } else if (
          normalized.includes("address") ||
          normalized.includes("site")
        ) {
          autoMappings[header] = "addressSite";
        } else if (normalized.includes("equipment")) {
          autoMappings[header] = "equipmentType";
        } else if (normalized.includes("material")) {
          autoMappings[header] = "materialType";
        } else if (normalized.includes("price")) {
          autoMappings[header] = "pricePerUnit";
        } else if (normalized.includes("cubic") || normalized.includes("m3")) {
          autoMappings[header] = "cubicMetreCapacity";
        } else if (normalized.includes("date")) {
          autoMappings[header] = "jobDate";
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
    const previewData: JobImportData[] = csvData.map((row) => {
      const job: JobImportData = {};

      Object.entries(mappings).forEach(([csvColumn, field]) => {
        const value = row[csvColumn];

        if (value !== undefined && value !== null && value !== "") {
          switch (field) {
            case "loadNumber":
            case "cubicMetreCapacity":
              const intVal = Number.parseInt(value.toString(), 10);
              if (!isNaN(intVal)) {
                job[field as keyof JobImportData] = intVal;
              }
              break;
            case "pricePerUnit":
              const floatVal = Number.parseFloat(value.toString());
              if (!isNaN(floatVal)) {
                job[field as keyof JobImportData] = floatVal;
              }
              break;
            case "jobDate":
              // Parse date to YYYY-MM-DD format
              const parsedDate = parseDate(value);
              if (parsedDate) {
                job[field as keyof JobImportData] = parsedDate;
              }
              break;
            default:
              job[field as keyof JobImportData] = value
                .toString()
                .trim() as any;
          }
        }
      });

      return job;
    });

    setPreview(previewData.slice(0, 5)); // Show first 5 for preview
    setStep("preview");
  };

  const handleImport = async () => {
    setImporting(true);

    const importData = csvData.map((row, index) => {
      // Start with empty object - all fields are optional now
      const job: any = {};

      // Add optional customerId if provided
      if (customerId) {
        job.customerId = customerId;
      }

      // Process mapped fields
      Object.entries(mappings).forEach(([csvColumn, field]) => {
        const value = row[csvColumn];

        if (value !== undefined && value !== null && value !== "") {
          switch (field) {
            case "loadNumber":
            case "cubicMetreCapacity":
              const intVal = Number.parseInt(value.toString(), 10);
              if (!isNaN(intVal)) {
                job[field] = intVal;
              }
              break;
            case "pricePerUnit":
              const floatVal = Number.parseFloat(value.toString());
              if (!isNaN(floatVal)) {
                job[field] = floatVal;
              }
              break;
            case "jobDate":
              const parsedDate = parseDate(value);
              if (parsedDate) {
                job[field] = parsedDate;
              }
              break;
            case "jobNumber":
              // Check if it's a valid job number (not "Account" or "invoice")
              const jobNumberValue = value.toString().trim();
              if (
                jobNumberValue.toLowerCase() === "account" ||
                jobNumberValue.toLowerCase() === "invoice"
              ) {
                // Skip placeholder values - don't add jobNumber field at all
              } else {
                job.jobNumber = jobNumberValue;
              }
              break;
            default:
              // Only add string fields if they have content
              const trimmedValue = value.toString().trim();
              if (trimmedValue) {
                job[field] = trimmedValue;
              }
          }
        }
      });

      return job;
    });

    try {
      console.log("Importing jobs:", importData); // Debug log
      console.log(
        "Sending to API:",
        JSON.stringify({ jobs: importData }, null, 2),
      ); // More detailed log
      const result = await jobsImportMutation.mutateAsync({ jobs: importData });
      console.log("Import result:", result);
    } catch (error) {
      console.error("Import error details:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Full error:", error);
      }
      // Error handling is done in the mutation's onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl">Import Jobs from CSV</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6 py-4">
            <CSVUploader onUpload={handleCSVUpload} accept={[".csv"]} />

            <div className="rounded-lg bg-muted/50 p-6">
              <h4 className="mb-3 font-medium text-base">Expected Format:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  • Contact Person, Contact Number, Rego, Load, Company, Job
                  Number
                </li>
                <li>
                  • Address/Site, Equipment, Material, Price, Cubic Metres, Date
                </li>
                <li>• First row should contain column headers</li>
                <li>• Dates should be in DD/MM/YYYY or YYYY-MM-DD format</li>
              </ul>
            </div>
          </div>
        )}

        {step === "mapping" && (
          <div className="space-y-6 py-4">
            <Alert className="mb-6">
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                Map your CSV columns to job fields. We've auto-detected some
                mappings.
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
                Ready to import {csvData.length} jobs. Preview of first 5 below:
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-3">Contact</TableHead>
                    <TableHead className="py-3">Rego</TableHead>
                    <TableHead className="py-3">Company</TableHead>
                    <TableHead className="py-3">Site</TableHead>
                    <TableHead className="py-3">Equipment</TableHead>
                    <TableHead className="py-3">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((job, index) => (
                    <TableRow key={index}>
                      <TableCell className="py-3">
                        {job.contactPerson}
                        {job.contactNumber && (
                          <div className="text-xs text-muted-foreground">
                            {job.contactNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-3">{job.rego}</TableCell>
                      <TableCell className="py-3">{job.companyName}</TableCell>
                      <TableCell className="max-w-[150px] truncate py-3">
                        {job.addressSite}
                      </TableCell>
                      <TableCell className="py-3">
                        {job.equipmentType}
                      </TableCell>
                      <TableCell className="py-3">{job.jobDate}</TableCell>
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
                    Import {csvData.length} Jobs
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
