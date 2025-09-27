import { BaseControl } from "@lib/core";
import { useFieldValue } from "@lib/react";

type ValueWatcherProps = {
  className?: string;
  title?: string;
  control: BaseControl;
};

export function ValueWatcher({ title, control, className }: ValueWatcherProps) {
  const value = useFieldValue([], control);

  return (
    <div className={className}>
      {title && <h3>{title}</h3>}
      <div style={{ whiteSpace: "pre-wrap" }}>
        {value ? JSON.stringify(value, null, 2) : "null"}
      </div>
    </div>
  );
}
