import { LabelHTMLAttributes } from "react";

import { cn } from "@src/utils";

type FormLabelProps = Pick<
  LabelHTMLAttributes<HTMLLabelElement>,
  "className" | "children" | "htmlFor"
>;

export function FormLabel({ className, htmlFor, children, ...rest }: FormLabelProps) {
  if (children == null) {
    return <div className={cn("h-5", className)} {...rest} />;
  }

  return (
    <label className={cn("mb-1 text-sm inline-block", className)} htmlFor={htmlFor} {...rest}>
      {children}
    </label>
  );
}
