"use client";

import { isValidJSON } from "@midday/invoice/content";
import { cn } from "@midday/ui/cn";
import type { JSONContent } from "@tiptap/react";
import { useFormContext } from "react-hook-form";
import { Editor } from "./editor";
import { useState, useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { formatAmount } from "@/utils/format";
import { Briefcase } from "lucide-react";

interface Job {
  id: string;
  jobNumber: string;
  companyName?: string;
  contactPerson?: string;
  addressSite?: string;
  materialType?: string;
  equipmentType?: string;
  pricePerUnit?: number;
  cubicMetreCapacity?: number;
  status: string;
  customerId?: string;
}

export function DescriptionWithJobSearch({
  className,
  name,
  index,
  ...props
}: React.ComponentProps<typeof Editor> & { name: string; index: number }) {
  const { watch, setValue, trigger, getValues } = useFormContext();
  const fieldValue = watch(name);
  const [showJobSearch, setShowJobSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [plainTextContent, setPlainTextContent] = useState("");
  const [selectedJobDescription, setSelectedJobDescription] = useState<string | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const currency = watch("template.currency");
  const locale = watch("template.locale");
  const customerId = watch("customerId");
  
  const trpc = useTRPC();

  // Query jobs for search - filter by customer if selected and uninvoiced jobs
  const { data: jobsData } = useQuery(
    trpc.job.get.queryOptions({
      q: searchQuery,
      customerId: customerId || undefined,
      status: ["pending", "in_progress", "completed"], // Only show uninvoiced jobs
      pageSize: 10,
    }, {
      enabled: searchQuery.length > 0,
    })
  );

  // Handle click outside to close job search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowJobSearch(false);
      }
    };

    if (showJobSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showJobSearch]);

  const handleOnChange = (content?: JSONContent | null) => {
    const value = content ? JSON.stringify(content) : null;

    // Extract plain text for search
    if (content?.content?.[0]?.content?.[0]?.text) {
      const text = content.content[0].content[0].text;
      setPlainTextContent(text);
      
      // Only set search query if not from a job selection
      if (!selectedJobDescription) {
        setSearchQuery(text);
        // Show job search if typing and has text
        if (text.length > 0) {
          setShowJobSearch(true);
        } else {
          setShowJobSearch(false);
        }
      }
    } else {
      setPlainTextContent("");
      setSearchQuery("");
      setShowJobSearch(false);
    }

    setValue(name, value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    // Clear selected job description after it's been saved to form
    if (selectedJobDescription) {
      setSelectedJobDescription(null);
    }
  };

  const handleJobSelect = (job: Job) => {
    console.log("Selected job:", job);
    console.log("Job details - Capacity:", job.cubicMetreCapacity, "Price:", job.pricePerUnit);
    
    // Create description from job details
    const description = `Job #${job.jobNumber}${job.addressSite ? ` - ${job.addressSite}` : ""}${job.materialType ? ` - ${job.materialType}` : ""}${job.equipmentType ? ` (${job.equipmentType})` : ""}`;
    
    // Create the description content
    const descriptionContent = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: description,
            },
          ],
        },
      ],
    };
    
    // Close search dropdown
    setShowJobSearch(false);
    setSearchQuery("");
    setSelectedJobDescription(description);
    
    // Set the description immediately
    setValue(name, JSON.stringify(descriptionContent), {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    // Set quantity - this is the cubic metre capacity (e.g., 22 for a 22m³ truck)
    const quantity = job.cubicMetreCapacity ? Number(job.cubicMetreCapacity) : 1;
    console.log("Setting quantity to:", quantity);
    
    setValue(`lineItems.${index}.quantity`, quantity, {
      shouldValidate: true,
      shouldDirty: true, 
      shouldTouch: true,
    });

    // Set price per unit (e.g., $15 per m³)
    const price = job.pricePerUnit ? Number(job.pricePerUnit) : 0;
    console.log("Setting price per m³ to:", price);
    
    setValue(`lineItems.${index}.price`, price, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });

    // Set unit to m³ for cubic metres
    if (job.cubicMetreCapacity) {
      setValue(`lineItems.${index}.unit`, "m³", {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }

    // Store job ID for reference
    setValue(`lineItems.${index}.jobId`, job.id, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
    
    // Trigger all fields to update
    requestAnimationFrame(() => {
      trigger([
        name,
        `lineItems.${index}.quantity`, 
        `lineItems.${index}.price`,
        `lineItems.${index}.unit`,
      ]).then(() => {
        const values = getValues(`lineItems.${index}`);
        console.log("Final line item values:", values);
        console.log("Should show:", quantity, "×", price, "= $", quantity * price);
      });
    });
  };

  const handleFocus = () => {
    if (plainTextContent.length > 0) {
      setShowJobSearch(true);
    }
  };

  // Use selected job description or existing field value
  const editorContent = selectedJobDescription 
    ? {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: selectedJobDescription,
              },
            ],
          },
        ],
      }
    : (isValidJSON(fieldValue) ? JSON.parse(fieldValue) : fieldValue);

  return (
    <div className="relative" ref={searchContainerRef}>
      <Editor
        key={`${name}-${selectedJobDescription || ''}`}
        initialContent={editorContent}
        onChange={handleOnChange}
        onFocus={handleFocus}
        className={cn(
          "border-0 p-0 min-h-6 border-b border-transparent focus:border-border font-mono text-xs pt-1",
          "transition-colors duration-200",
          className,
        )}
        placeholder="Type to search jobs or enter description..."
        {...props}
      />
      
      {showJobSearch && searchQuery && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-md border bg-popover shadow-lg">
          {jobsData?.data && jobsData.data.length > 0 ? (
            <div className="p-1">
              <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium flex items-center gap-1">
                <Briefcase className="h-3 w-3" />
                Select a job to auto-fill details
              </div>
              {jobsData.data.map((job: Job) => (
                <button
                  key={job.id}
                  type="button"
                  className="w-full rounded-sm px-2 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => handleJobSelect(job)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium">
                        Job #{job.jobNumber}
                        {job.companyName && (
                          <span className="text-muted-foreground ml-1">• {job.companyName}</span>
                        )}
                      </div>
                      {job.addressSite && (
                        <div className="text-muted-foreground mt-0.5">{job.addressSite}</div>
                      )}
                      <div className="text-muted-foreground mt-0.5">
                        {job.materialType && <span>{job.materialType}</span>}
                        {job.equipmentType && <span className="ml-2">• {job.equipmentType}</span>}
                      </div>
                    </div>
                    {job.pricePerUnit && job.cubicMetreCapacity && (
                      <div className="text-right">
                        <div className="font-medium">
                          {formatAmount({
                            amount: job.pricePerUnit * job.cubicMetreCapacity,
                            currency,
                            locale,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          {job.cubicMetreCapacity} m³ × {formatAmount({
                            amount: job.pricePerUnit,
                            currency,
                            locale,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      job.status === "completed" && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                      job.status === "in_progress" && "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                      job.status === "pending" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
                    )}>
                      {job.status.replace("_", " ")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length > 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              No jobs found matching "{searchQuery}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}