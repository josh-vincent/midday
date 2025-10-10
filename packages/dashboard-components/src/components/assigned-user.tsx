import { Avatar } from "@midday/ui/avatar";
import Image from "next/image";

type Props = {
  avatarUrl?: string | null;
  fullName?: string | null;
};

/**
 * AssignedUser - Display a user with avatar and name
 *
 * @example
 * ```tsx
 * <AssignedUser avatarUrl="/avatar.jpg" fullName="John Doe" />
 * ```
 */
export function AssignedUser({ avatarUrl, fullName }: Props) {
  return (
    <div className="flex space-x-2 items-center">
      {avatarUrl && (
        <Avatar className="h-5 w-5">
          <Image src={avatarUrl} alt={fullName ?? ""} width={20} height={20} />
        </Avatar>
      )}
      <span className="truncate">{fullName?.split(" ").at(0)}</span>
    </div>
  );
}