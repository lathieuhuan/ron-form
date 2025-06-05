import { ControlState, NamePath } from "@lib/core/types";
import { useWatchState } from "@lib/react";
import { ReactBaseControl } from "@lib/react/types";

import "./form-field.css";

type FormFieldProps = {
  className?: string;
  label: string;
  name?: NamePath;
  control?: ReactBaseControl<any>;
  children: React.ReactNode | ((state: ControlState) => React.ReactNode);
};

export function FormField({ className = "", label, name = [], control, children }: FormFieldProps) {
  const state = useWatchState(name, control);
  const error = state.isTouched && state.errors ? Object.values(state.errors)[0] : null;

  return (
    <div className={`form-field ${className}`}>
      <div className="form-field__content">
        <label>{label}</label>
        {typeof children === "function" ? children(state) : children}
      </div>
      {error && <div className="form-field__error">{error}</div>}
    </div>
  );
}
