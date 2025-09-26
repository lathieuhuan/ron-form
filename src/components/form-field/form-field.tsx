import clsx from "clsx";

import { ControlState, NamePath } from "@lib/core";
import { ReactBaseControl, useControlState } from "@lib/react";

type FormFieldProps = {
  className?: string;
  label: string;
  name?: NamePath;
  control?: ReactBaseControl<any>;
  children: React.ReactNode | ((state: ControlState) => React.ReactNode);
};

export function FormField({ className = "", label, name = [], control, children }: FormFieldProps) {
  const state = useControlState(name, control);
  const error = state.isTouched && state.errors ? Object.values(state.errors)[0] : null;

  return (
    <div className={clsx("relative mb-5", className)}>
      <div className="flex flex-col gap-1">
        <label>{label}</label>
        {typeof children === "function" ? children(state) : children}
      </div>
      {error && <div className="absolute top-full mt-1 pl-1 text-danger text-xs">{error}</div>}
    </div>
  );
}
