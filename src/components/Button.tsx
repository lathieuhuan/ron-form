import clsx from "clsx";
import { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type="button"
      className={clsx("px-2 py-1 rounded-sm border border-border cursor-pointer", props.className)}
    />
  );
}
