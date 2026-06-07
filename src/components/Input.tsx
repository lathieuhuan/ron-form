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
        "border-border h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:ring-1 focus:ring-primary aria-invalid:border-destructive aria-invalid:focus:ring-destructive",
        className,
      )}
      value={value ?? undefined}
      defaultValue={value == null && defaultValue != null ? defaultValue : undefined}
      onChange={(e) => {
        onChange?.(e.target.value, e);
      }}
      {...props}
    />
  );
}
