import clsx from "clsx";

import { BaseControl, ControlState, NamePath } from "@lib/core";
import { useFieldState } from "@lib/react";
import { useId } from "react";

type ChildrenRenderProps = {
  itemProps: {
    name: NamePath;
  };
  fieldProps: {
    id: string;
    "aria-invalid": boolean;
  };
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
  const state = useFieldState(name, control);
  const error = state.isTouched && state.errors ? Object.values(state.errors)[0] : null;

  return (
    <div className={clsx("relative mb-5", className)}>
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="w-fit">{label}</label>
        {typeof children === "function"
          ? children({
              itemProps: {
                name: name,
              },
              fieldProps: {
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
