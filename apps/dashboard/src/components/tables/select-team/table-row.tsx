"use client";

import { useTRPC } from "@/trpc/client";
import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Avatar, AvatarFallback, AvatarImageNext } from "@midday/ui/avatar";
import { SubmitButton } from "@midday/ui/submit-button";
import { TableRow as BaseTableRow, TableCell } from "@midday/ui/table";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  row: RouterOutputs["team"]["list"][number];
};

export function TableRow({ row }: Props) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const trpc = useTRPC();
  const router = useRouter();
  const { toast } = useToast();

  const changeTeamMutation = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: async () => {
        console.log(`[TableRow] Successfully switched to team ${row.id}`);
        toast({
          title: "Success",
          description: `Switched to ${row.name}`,
        });
        // Force a full page reload to refresh session
        window.location.href = "/";
      },
      onError: (error) => {
        console.error("Team switch error:", error);
        setIsLoading(false);
        toast({
          title: "Error",
          description: error.message || "Failed to switch teams. Please try again.",
          variant: "destructive",
        });
      },
    }),
  );

  return (
    <BaseTableRow key={row.id} className="hover:bg-transparent">
      <TableCell className="border-r-[0px] py-4 px-0">
        <div className="flex items-center space-x-4">
          <Avatar className="size-8 rounded-none">
            {row.logoUrl && (
              <AvatarImageNext
                src={row.logoUrl}
                alt={row.name ?? ""}
                width={32}
                height={32}
              />
            )}
            <AvatarFallback className="rounded-none">
              <span className="text-xs">
                {row?.name?.charAt(0)?.toUpperCase()}
              </span>
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{row?.name}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="px-0">
        <div className="flex justify-end">
          <div className="flex space-x-3 items-center">
            <SubmitButton
              isSubmitting={isLoading}
              variant="outline"
              onClick={() => {
                console.log("Switching to team:", row.id, row.name);
                setIsLoading(true);
                changeTeamMutation.mutate({
                  teamId: row.id!,
                });
              }}
            >
              Launch
            </SubmitButton>
          </div>
        </div>
      </TableCell>
    </BaseTableRow>
  );
}
