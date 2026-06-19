import type { ChangeEvent, ComponentProps } from "react";

import { cn } from "@src/utils";

export interface InputProps extends Omit<ComponentProps<"input">, "value" | "onChange"> {
  value?: string | null;
  onChange?: (value: string, e: ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ className, value, defaultValue, onChange, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 px-3 py-1 rounded-md border-border border bg-transparent shadow-xs transition-[color,box-shadow] outline-none",
        "text-base md:text-sm placeholder:text-muted/60",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:ring-1 focus:ring-primary aria-invalid:border-destructive aria-invalid:focus:ring-destructive",
        className,
      )}
      value={value ?? undefined}
      defaultValue={value == null && defaultValue != null ? defaultValue : undefined}
      autoComplete="off"
      placeholder="Enter"
      onChange={(e) => {
        onChange?.(e.target.value, e);
      }}
      {...props}
    />
  );
}
