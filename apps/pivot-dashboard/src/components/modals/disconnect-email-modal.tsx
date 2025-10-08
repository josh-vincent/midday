"use client";

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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useToast } from "@midday/ui/use-toast";
import { useRouter } from "next/navigation";

export function DisconnectEmailModal() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  // TODO: Get connection ID from modal state
  const connectionId = null;

  const disconnectMutation = useMutation(
    trpc.emails.disconnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              queryKey[0] === "trpc" &&
              queryKey[1] &&
              queryKey[1].toString().startsWith("emails.")
            );
          },
        });
        toast({
          title: "Email disconnected",
          description: "Your email account has been disconnected successfully",
        });
        router.refresh();
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

  const handleDisconnect = async () => {
    if (!connectionId) return;
    await disconnectMutation.mutateAsync({ id: connectionId });
  };

  return (
    <AlertDialog open={!!connectionId}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Email Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to disconnect this email account? This will
            stop syncing emails and remove the connection.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDisconnect}
            disabled={disconnectMutation.isPending}
          >
            {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
