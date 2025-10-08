import { CardContent } from "@midday/ui/card";
import { Skeleton } from "@midday/ui/skeleton";

export function BankAccountListSkeleton() {
  return (
    <CardContent className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </CardContent>
  );
}
