import { BaseControl, useWatch, useWatchState } from "@lib/react";

type WatcherProps = {
  className?: string;
  title?: string;
  control: BaseControl;
};

export function ValueWatcher({ title, control, className }: WatcherProps) {
  const value = useWatch([], control);
  return (
    <div className={className}>
      {title && <h3>{title}</h3>}
      <div style={{ whiteSpace: "pre-wrap" }}>
        {value ? JSON.stringify(value, null, 2) : "null"}
      </div>
    </div>
  );
}

export function StateWatcher({ title, control, className }: WatcherProps) {
  const state = useWatchState([], control);
  return (
    <div className={className}>
      {title && <h3>{title}</h3>}
      <div style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(state, null, 2)}</div>
    </div>
  );
}
