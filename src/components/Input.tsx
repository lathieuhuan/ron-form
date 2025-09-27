import clsx from "clsx";
import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ value = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={clsx(
        "px-2 py-1 rounded-sm border border-border outline-none focus:ring-1 focus:ring-primary",
        "aria-invalid:border-destructive aria-invalid:focus:ring-destructive",
        props.className,
      )}
      value={value}
    />
  );
}
