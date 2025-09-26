import { ButtonHTMLAttributes } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="px-2 py-1 rounded-sm border border-border cursor-pointer"
      {...props}
    />
  );
}
