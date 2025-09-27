import { useEffect, useId, useState } from "react";

import { BaseControl, ControlState, NamePath } from "@lib/core";
import { useControl } from "@lib/react";
import { cn } from "@src/utils";

type ChildrenRenderProps = {
  control: BaseControl<unknown>;
  field: {
    id: string;
    "aria-invalid": boolean;
  };
  state: ControlState;
};

type FormFieldProps = {
  className?: string;
  label: string;
  name?: NamePath;
  control?: BaseControl;
  children: React.ReactNode | ((props: ChildrenRenderProps) => React.ReactNode);
};

export function FormField({ className = "", label, name = [], control, children }: FormFieldProps) {
  const id = `field${useId()}`;
  const _control = useControl(name, control) as BaseControl<unknown>;
  const [state, setState] = useState<ControlState>(_control.getState());

  useEffect(() => {
    return _control.subscribeState(setState);
  }, [_control]);

  const error = state.isTouched && state.errors ? Object.values(state.errors)[0] : null;

  return (
    <div className={cn("relative mb-5", className)}>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="w-fit">
          {label}
        </label>
        {typeof children === "function"
          ? children({
              control: _control,
              state,
              field: {
                id,
                "aria-invalid": !!error,
              },
            })
          : children}
      </div>
      {error && <div className="absolute top-full mt-1 pl-1 text-destructive text-xs">{error}</div>}
    </div>
  );
}
