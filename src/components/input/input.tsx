import clsx from "clsx";
import { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  isError?: boolean;
};

export function Input({ isError, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={clsx(
        "px-2 py-1 rounded-sm border border-border focus:ring-1 focus:ring-primary",
        "data-[invalid=true]:border-danger data-[invalid=true]:focus:ring-danger",
        props.className,
      )}
      aria-invalid={isError}
    />
  );
}
