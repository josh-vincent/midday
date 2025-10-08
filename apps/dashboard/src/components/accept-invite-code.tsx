"use client";

import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Input } from "@midday/ui/input";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AcceptInviteCode() {
  const [code, setCode] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  const updateUserMutation = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries();
        router.push("/");
      },
    }),
  );

  const acceptByCodeMutation = useMutation(
    trpc.team.acceptInviteByCode.mutationOptions({
      onSuccess: async (data) => {
        if (!data.teamId) {
          return;
        }

        toast({
          title: "Success",
          description: `You've joined ${data.teamName || "the team"}!`,
        });

        // Invalidate team queries first
        await queryClient.invalidateQueries({
          queryKey: trpc.team.list.queryKey(),
        });

        // Update user's current teamId
        updateUserMutation.mutate({
          teamId: data.teamId,
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message || "Invalid or expired invite code",
          variant: "destructive",
        });
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    acceptByCodeMutation.mutate({ code: code.trim().toUpperCase() });
  };

  return (
    <div className="border border-dashed rounded-lg p-6 mt-4">
      <h3 className="text-sm font-medium mb-2">Have an invite code?</h3>
      <p className="text-xs text-[#878787] mb-4">
        Enter your invitation code to join a team
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className="uppercase"
          maxLength={10}
          disabled={acceptByCodeMutation.isPending}
        />
        <Button
          type="submit"
          disabled={!code.trim() || acceptByCodeMutation.isPending}
        >
          {acceptByCodeMutation.isPending ? "Joining..." : "Join"}
        </Button>
      </form>
    </div>
  );
}
