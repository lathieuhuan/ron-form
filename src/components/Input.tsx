import { cn } from "@src/utils";

export function Input({ className, type, value, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-border h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus:ring-1 focus:ring-primary aria-invalid:border-destructive aria-invalid:focus:ring-destructive",
        className,
      )}
      value={value ?? ""}
      {...props}
    />
  );
}
