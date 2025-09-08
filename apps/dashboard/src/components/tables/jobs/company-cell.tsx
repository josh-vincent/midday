"use client";

import { useCustomerParams } from "@/hooks/use-customer-params";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midday/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@midday/ui/tooltip";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Link2, Plus, Search } from "lucide-react";
import { useMemo } from "react";
import type { Job } from "./columns";

interface CompanyCellProps {
  job: Job;
}

export function CompanyCell({ job }: CompanyCellProps) {
  const trpc = useTRPC();
  const { toast } = useToast();
  const { setParams: setCustomerParams } = useCustomerParams();
  const queryClient = useQueryClient();

  // Get existing customers to check if company exists
  const { data: customersData } = useQuery({
    ...trpc.customers.get.queryOptions({
      q: job.companyName || "",
      pageSize: 10,
    }),
    enabled: !!job.companyName && !job.customerId,
  });

  // Update job to link with existing customer
  const updateJobMutation = useMutation(
    trpc.job.update.mutationOptions({
      onSuccess: () => {
        // Invalidate jobs queries to refresh the table
        queryClient.invalidateQueries({
          predicate: (query) => {
            return query.queryKey[0] === 'trpc' && 
                   (query.queryKey[1] === 'job.list' || query.queryKey[1] === 'job.get');
          },
        });
        
        toast({
          title: "Job updated",
          description: "Company has been linked to existing customer",
        });
      },
      onError: (error) => {
        console.error('Job update error:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update job",
          variant: "destructive",
        });
      },
    }),
  );

  // Check if company is linked to a customer
  const isLinked = !!job.customerId;
  
  // Find potential customer matches
  const potentialMatches = useMemo(() => {
    if (!customersData?.data || !job.companyName) return [];
    
    return customersData.data.filter(customer => 
      customer.name?.toLowerCase().includes(job.companyName!.toLowerCase()) ||
      job.companyName!.toLowerCase().includes(customer.name?.toLowerCase() || "")
    );
  }, [customersData, job.companyName]);

  const hasWarning = !isLinked && job.companyName;

  const handleLinkCustomer = async (customerId: string, customerName: string) => {
    await updateJobMutation.mutateAsync({
      id: job.id,
      customerId,
      companyName: customerName,
    });
  };

  const handleCreateCustomer = () => {
    setCustomerParams({
      createCustomer: true,
      name: job.companyName || "",
      jobId: job.id, // Pass job ID so we can link after creation
    });
  };

  if (!job.companyName) {
    return <span className="text-muted-foreground">No company</span>;
  }

  return (
    <div className="flex items-center gap-2 max-w-[200px]">
      <span className="truncate">
        {job.companyName}
      </span>
      
      {hasWarning && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Company not linked to customer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Link Company to Customer</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {potentialMatches.length > 0 ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  Potential Matches:
                </DropdownMenuLabel>
                {potentialMatches.map((customer) => (
                  <DropdownMenuItem
                    key={customer.id}
                    onClick={() => handleLinkCustomer(customer.id, customer.name || "")}
                    className="flex items-center gap-2"
                  >
                    <Link2 className="h-3 w-3" />
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.name}</span>
                      {customer.email && (
                        <span className="text-xs text-muted-foreground">
                          {customer.email}
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            ) : (
              <>
                <DropdownMenuItem disabled>
                  <Search className="h-3 w-3 mr-2" />
                  No matching customers found
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem
              onClick={handleCreateCustomer}
              className="flex items-center gap-2"
            >
              <Plus className="h-3 w-3" />
              Create "{job.companyName}" as new customer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}