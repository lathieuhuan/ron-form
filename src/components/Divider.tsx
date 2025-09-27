import clsx from "clsx";

type DividerProps = {
  direction?: "horizontal" | "vertical";
};

export function Divider({ direction = "horizontal" }: DividerProps) {
  return (
    <div
      className={clsx(
        "bg-border opacity-50",
        direction === "horizontal" ? "w-full h-px" : "w-px h-full",
      )}
    />
  );
}
