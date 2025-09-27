import { BaseControl } from "@lib/core";
import { useFieldState } from "@lib/react";

type StateWatcherProps = {
  className?: string;
  title?: string;
  control: BaseControl;
};

export function StateWatcher({ title, control, className }: StateWatcherProps) {
  const state = useFieldState([], control);

  return (
    <div className={className}>
      {title && <h3>{title}</h3>}
      <div style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(state, null, 2)}</div>
    </div>
  );
}
