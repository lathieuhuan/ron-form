import { HTMLAttributes, LabelHTMLAttributes } from "react";

import { cn } from "@src/utils";

type FieldLabelProps = Pick<
  LabelHTMLAttributes<HTMLLabelElement>,
  "className" | "children" | "htmlFor"
>;

export function FieldLabel({ className, htmlFor, children, ...rest }: FieldLabelProps) {
  if (children == null) {
    return <div className={cn("h-5", className)} {...rest} />;
  }

  return (
    <label className={cn("mb-1 text-sm inline-block", className)} htmlFor={htmlFor} {...rest}>
      {children}
    </label>
  );
}

type FormErrorProps = HTMLAttributes<HTMLDivElement>;

export function FormError({ className, ...rest }: FormErrorProps) {
  return <div className={cn("text-sm text-destructive", className)} {...rest} />;
}
