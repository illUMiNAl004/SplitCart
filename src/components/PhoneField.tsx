"use client";

import { formatPhone, phoneDigits } from "@/lib/phone";
import { cn } from "./ui";

export function PhoneField({
  value,
  onChange,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (digits: string) => void;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-14 items-center rounded-2xl bg-raised px-5 focus-within:ring-2 focus-within:ring-lime",
        className,
      )}
    >
      <span className="text-lg text-muted">+1</span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        autoFocus={autoFocus}
        value={formatPhone(value)}
        onChange={(e) => onChange(phoneDigits(e.target.value))}
        placeholder="(413) 555-0123"
        className="h-full w-full bg-transparent pl-2 text-lg outline-none placeholder:text-muted/60"
      />
    </div>
  );
}
