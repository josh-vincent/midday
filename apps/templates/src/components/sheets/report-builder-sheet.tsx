"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@midday/ui/sheet";
import { Button } from "@midday/ui/button";
import { ScrollArea } from "@midday/ui/scroll-area";
import { ReportBuilder } from "@/components/reports/report-builder";
import { Settings, Plus, Edit } from "lucide-react";
import type { MockReport } from "@/lib/mock/reports-mock";

type Props = {
  report?: MockReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateReport: (report: Partial<MockReport>) => void;
};

export function ReportBuilderSheet({ 
  report, 
  open, 
  onOpenChange,
  onCreateReport,
}: Props) {
  const isEditing = !!report;

  const handleCreateReport = (reportData: Partial<MockReport>) => {
    onCreateReport(reportData);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Edit className="h-5 w-5" />
                <span>Edit Report</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                <span>Create Report</span>
              </>
            )}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? "Modify your existing report configuration"
              : "Configure and generate a new custom report"
            }
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-6">
          <div className="py-6">
            <ReportBuilder 
              onCreateReport={handleCreateReport}
              compact={false}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}