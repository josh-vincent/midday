"use client";

import { Button } from "@midday/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@midday/ui/card";
import { Input } from "@midday/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@midday/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useMemo, useDeferredValue } from "react";
import { useToast } from "@midday/ui/use-toast";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { Truck, Plus } from "lucide-react";
import { useJobParams } from "@/hooks/use-job-params";
import { OpenJobSheet } from "../open-job-sheet";
import { useGatekeeperFilterParams } from "@/hooks/use-gatekeeper-filter-params";
import { GatekeeperHeader } from "./gatekeeper-header";
import { getLocalDateString } from "@/utils/date";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midday/ui/alert-dialog";

// Material options should match job form for consistency
const MATERIAL_OPTIONS = [
  { value: "Dry Clean Fill", label: "Dry Clean Fill" },
  { value: "Wet Fill", label: "Wet Fill" },
  { value: "Rock", label: "Rock" },
  { value: "Sand", label: "Sand" },
  { value: "Topsoil", label: "Topsoil" },
  { value: "Clay", label: "Clay" },
  { value: "Gravel", label: "Gravel" },
  { value: "Concrete", label: "Concrete" },
  { value: "Asphalt", label: "Asphalt" },
  { value: "Mixed", label: "Mixed" },
  { value: "Other", label: "Other" },
];


export function GatekeeperForm() {
  const { toast } = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  // Get today's grouped jobs to check for existing entries
  // Use local date to ensure we get the correct day regardless of timezone
  const today = useMemo(() => getLocalDateString(), []);
  
  const { data: todaysGroupedJobs = [] } = useQuery(
    trpc.job.getJobsGroupedByTruckForDate.queryOptions(
      { date: today },
      {
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
        refetchOnMount: true,
      }
    )
  );

  const [quickAddMaterialType, setQuickAddMaterialType] = useState("");
  const [showAddLoadConfirm, setShowAddLoadConfirm] = useState(false);
  const [pendingLoadEntry, setPendingLoadEntry] = useState<any>(null);

  // Use nuqs-based filtering (like customers page)
  const { filter } = useGatekeeperFilterParams();
  const deferredSearch = useDeferredValue(filter.q);

  const addLoadMutation = useMutation(
    trpc.job.addLoadWithDirtType.mutationOptions({
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Additional load added successfully",
        });
        
        setQuickAddMaterialType(""); // Clear material type selection
        
        // Invalidate queries
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' && 
                   queryKey[1] && 
                   queryKey[1].toString().startsWith('job.');
          },
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    })
  );

  const handleAddLoadClick = (entry: any, materialType: string) => {
    if (!materialType) {
      toast({
        title: "Error",
        description: "Please select a material type",
        variant: "destructive",
      });
      return;
    }

    // Store the entry and material type for confirmation
    setPendingLoadEntry({
      entry,
      materialType,
      newLoadNumber: entry.maxLoadNumber + 1,
    });
    setShowAddLoadConfirm(true);
  };

  const handleConfirmAddLoad = async () => {
    if (!pendingLoadEntry) return;

    setShowAddLoadConfirm(false);
    
    await addLoadMutation.mutateAsync({
      originalJobId: pendingLoadEntry.entry.latestJob.id,
      date: today,
      dirtType: pendingLoadEntry.materialType as any, // API still uses dirtType param
    });
    
    setPendingLoadEntry(null);
  };

  // Apply simple search filtering (like customers page)
  const filteredJobs = useMemo(() => {
    let jobs = [...todaysGroupedJobs];

    // Search filter - only by customer name and rego
    if (deferredSearch) {
      const searchLower = deferredSearch.toLowerCase();
      jobs = jobs.filter((entry) =>
        entry.companyName.toLowerCase().includes(searchLower) ||
        entry.rego.toLowerCase().includes(searchLower)
      );
    }

    return jobs;
  }, [todaysGroupedJobs, deferredSearch]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with Search - Fixed at top */}
      <div className="flex-shrink-0 pb-4">
        <Card>
          <CardContent className="pt-6">
            <GatekeeperHeader />
          </CardContent>
        </Card>
      </div>

      {/* Today's Entries Section - Takes up 3/4 of remaining space with scroll */}
      <div className="flex-1 min-h-0 h-[75%] overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0 border-b">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Today's Entries ({filteredJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-4">
            {todaysGroupedJobs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No entries for today yet</p>
                  <p className="text-sm">Create your first job entry below</p>
                </div>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-8 text-muted-foreground">
                  No entries match your search
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map((entry, index) => (
                  <div
                    key={`${entry.companyName}-${entry.rego}`}
                    className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-1 ">
                      <div className="grid min-h-[100px]">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-3xl align-middle justify-center font-bold">{entry.rego}</div>
                          <div className="text-lg text-muted-foreground">
                            {entry.companyName}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {entry.totalLoads} load{entry.totalLoads > 1 ? 's' : ''}
                          </span>
                          {entry.latestJob.materialType && (
                            <span>
                              Last: {entry.latestJob.materialType}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Quick Add Load Button */}
                      <Button
                        onClick={() => handleAddLoadClick(entry, quickAddMaterialType || entry.latestJob.materialType || "")}
                        disabled={addLoadMutation.isPending || (!quickAddMaterialType && !entry.latestJob.materialType)}
                        size="sm"
                        variant="default"
                        className="flex items-center gap-2 w-full"
                      >
                        <Plus className="h-4 w-4" />
                        Add Load
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom - Fixed New Entry Section (1/4 of height) */}
      <div className="flex-shrink-0 h-[25%] min-h-[150px] max-h-[200px] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Card className="h-full border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">New Entry</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <OpenJobSheet className="w-full h-14 text-lg" />
          </CardContent>
        </Card>
      </div>
    {/* Add Load Confirmation Dialog */}
    <AlertDialog open={showAddLoadConfirm} onOpenChange={setShowAddLoadConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Additional Load</AlertDialogTitle>
          <AlertDialogDescription>
            Please review the details for this additional load:
            <div className="mt-4 space-y-2 text-sm text-left mx-auto px-4">
              <div><strong>Company:</strong> {pendingLoadEntry?.entry.companyName}</div>
              <div><strong>Rego:</strong> {pendingLoadEntry?.entry.rego}</div>
              <div><strong>Load Number:</strong> {pendingLoadEntry?.newLoadNumber}</div>
              <div><strong>Material Type:</strong> {pendingLoadEntry?.materialType}</div>
              {pendingLoadEntry?.entry.latestJob.equipmentType && (
                <div><strong>Equipment Type:</strong> {pendingLoadEntry.entry.latestJob.equipmentType}</div>
              )}
              {pendingLoadEntry?.entry.latestJob.cubicMetreCapacity && (
                <div><strong>Cubic Metres:</strong> {pendingLoadEntry.entry.latestJob.cubicMetreCapacity} m³</div>
              )}
              {pendingLoadEntry?.entry.latestJob.pricePerUnit && (
                <div><strong>Price per Unit:</strong> ${pendingLoadEntry.entry.latestJob.pricePerUnit}</div>
              )}
              <div><strong>Date:</strong> {today}</div>
              {pendingLoadEntry?.entry.latestJob.addressSite && (
                <div><strong>Site:</strong> {pendingLoadEntry.entry.latestJob.addressSite}</div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setShowAddLoadConfirm(false);
            setPendingLoadEntry(null);
          }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmAddLoad}>
            Confirm & Add Load
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}