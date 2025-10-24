import { useEffect, useId, useState } from "react";

import { BaseControl, ControlState, NamePath } from "@lib/core";
import { useControl } from "@lib/react";
import { cn } from "@src/utils";

type ChildrenRenderProps<TValue = unknown> = {
  control: BaseControl<TValue>;
  field: {
    id: string;
    "aria-invalid": boolean;
  };
  state: ControlState;
};

type FormFieldProps<TValue = unknown> = {
  className?: string;
  label: string;
  name?: NamePath;
  control?: BaseControl<TValue>;
  children: React.ReactNode | ((props: ChildrenRenderProps<TValue>) => React.ReactNode);
};

export function FormField<TValue = unknown>({
  className,
  label,
  name = [],
  control,
  children,
}: FormFieldProps<TValue>) {
  const id = `field${useId()}`;
  const _control = useControl<BaseControl<TValue>>(name, control);
  const [state, setState] = useState(_control.getState());

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
