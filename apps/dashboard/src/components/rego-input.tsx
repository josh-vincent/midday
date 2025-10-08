"use client";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@midday/ui/input-otp";
import { cn } from "@midday/ui/cn";

interface RegoInputProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function RegoInput({
  value = "",
  onChange,
  className,
  disabled = false,
}: RegoInputProps) {
  // Remove any existing dashes from the value for the OTP input
  const cleanValue = (value || "").replace(/-/g, "").toUpperCase();

  const handleChange = (newValue: string) => {
    if (!onChange) return;

    // Convert to uppercase
    const cleaned = newValue.toUpperCase();

    // Format with dash: ABC-123
    if (cleaned.length <= 3) {
      onChange(cleaned);
    } else if (cleaned.length <= 6) {
      onChange(`${cleaned.slice(0, 3)}-${cleaned.slice(3)}`);
    }
  };

  return (
    <div className={cn("flex flex-row items-center", className)}>
      <InputOTP
        maxLength={6}
        value={cleanValue}
        onChange={handleChange}
        disabled={disabled}
        containerClassName="gap-0"
      >
        <InputOTPGroup className="gap-0">
          <InputOTPSlot
            index={0}
            className="h-12 w-10 text-xl font-bold uppercase border-2 rounded-none first:rounded-l"
          />
          <InputOTPSlot
            index={1}
            className="h-12 w-10 text-xl font-bold uppercase border-2 border-l-0 rounded-none"
          />
          <InputOTPSlot
            index={2}
            className="h-12 w-10 text-xl font-bold uppercase border-2 border-l-0 rounded-none text-cen"
          />
          <InputOTPSlot
            index={3}
            className="h-12 w-10 text-xl font-bold uppercase border-2 border-l-0 rounded-none"
          />
          <InputOTPSlot
            index={4}
            className="h-12 w-10 text-xl font-bold uppercase border-2 border-l-0 rounded-none"
          />
          <InputOTPSlot
            index={5}
            className="h-12 w-10 text-xl font-bold uppercase border-2 border-l-0 rounded-none last:rounded-r"
          />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
