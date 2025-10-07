"use client";

import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";
import { Button } from "@midday/ui/button";
import { Form, FormControl, FormField, FormItem } from "@midday/ui/form";
import { Input } from "@midday/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";
import { SubmitButton } from "@midday/ui/submit-button";
import { useToast } from "@midday/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useFieldArray } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  invites: z.array(
    z.object({
      email: z.string().email(),
      role: z.enum(["owner", "member"]),
    }),
  ),
});

type InviteFormProps = {
  onSuccess?: () => void;
  skippable?: boolean;
};

export function InviteForm({ onSuccess, skippable = true }: InviteFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const inviteMutation = useMutation(
    trpc.team.invite.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: trpc.team.teamInvites.queryKey(),
        });

        // Also invalidate team members list since we may have added users directly
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return queryKey[0] === 'trpc' &&
                   queryKey[1] &&
                   queryKey[1].toString().startsWith('team.');
          },
        });

        // Show appropriate feedback based on results
        const totalProcessed = (data.sent || 0) + (data.addedDirectly || 0);
        const addedDirectly = data.addedDirectly || 0;
        const sent = data.sent || 0;
        const skipped = data.skipped || 0;

        if (totalProcessed > 0 && skipped === 0) {
          const parts = [];
          if (addedDirectly > 0) parts.push(`${addedDirectly} added directly`);
          if (sent > 0) parts.push(`${sent} invite${sent > 1 ? "s" : ""} sent`);

          toast({
            title: "Team members invited",
            description: parts.join(", "),
            variant: "success",
          });
        } else if (totalProcessed > 0 && skipped > 0) {
          toast({
            title: "Invites partially processed",
            description: `${totalProcessed} processed, ${skipped} skipped (already members or invited)`,
          });
        } else if (totalProcessed === 0 && skipped > 0) {
          toast({
            title: "No invites sent",
            description: `All ${skipped} invite${skipped > 1 ? "s" : ""} were skipped (already members or invited)`,
          });
        }

        onSuccess?.();
      },
      onError: (error) => {
        console.error("Invite error:", error);
        toast({
          title: "Failed to send invites",
          description: error.message,
          variant: "destructive",
        });
      },
    }),
  );

  const form = useZodForm(formSchema, {
    defaultValues: {
      invites: [
        {
          email: "",
          role: "member",
        },
      ],
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    inviteMutation.mutate(data.invites.filter((invite) => invite.email !== ""));
  });

  const { fields, append } = useFieldArray({
    name: "invites",
    control: form.control,
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        {fields.map((field, index) => (
          <div
            className="flex items-center justify-between mt-3 space-x-4"
            key={index.toString()}
          >
            <FormField
              control={form.control}
              key={field.id}
              name={`invites.${index}.email`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="jane@example.com"
                      type="email"
                      autoComplete="off"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck="false"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`invites.${index}.role`}
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="min-w-[120px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        ))}

        <Button
          variant="outline"
          type="button"
          className="mt-4 border-none bg-[#F2F1EF] text-[11px] dark:bg-[#1D1D1D]"
          onClick={() => append({ email: "", role: "member" })}
        >
          Add more
        </Button>

        <div className="border-t-[1px] pt-4 mt-8 items-center justify-between">
          <div>
            {Object.values(form.formState.errors).length > 0 && (
              <span className="text-sm text-destructive">
                Please complete the fields above.
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            {skippable ? (
              <Link href="/">
                <Button
                  variant="ghost"
                  className="p-0 hover:bg-transparent font-normal"
                >
                  Skip this step
                </Button>
              </Link>
            ) : (
              <div />
            )}

            <SubmitButton
              type="submit"
              isSubmitting={inviteMutation.isPending}
              disabled={inviteMutation.isPending}
            >
              Send invites
            </SubmitButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
