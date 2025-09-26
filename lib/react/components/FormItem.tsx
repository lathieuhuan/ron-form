import { cloneElement, SyntheticEvent, useEffect, useState } from "react";

import { ParentControl } from "@lib/core/controls/ParentControl";
import { ItemControl } from "@lib/core/controls/ItemControl";
import { NamePath } from "@lib/core/types";
import { useChildControl } from "../hooks";
import { ReactItemControl } from "../types";

/** control is prioritized over name. should provide one of them */
type FormItemProps<TValue = unknown> = {
  name?: NamePath;
  control?: ReactItemControl<TValue>;
  children: JSX.Element;
};

export function FormItem<TValue = unknown>({
  name = [],
  control: controlProp,
  children,
}: FormItemProps<TValue>) {
  const { props } = children;
  const control = useChildControl(controlProp ? [] : name, controlProp) as ItemControl<TValue>;
  const [value, setValue] = useState(control.getValue());

  useEffect(() => {
    return control.subscribeValue((value) => setValue(value));
  }, [control]);

  const changeValue = (value: TValue) => {
    control.setValue(value);
    control.validateSync();
    control.notifyValueObservers();
    control.notifyStateObservers();
  };

  const onChange = (change: Event | SyntheticEvent | TValue, ...others: unknown[]) => {
    if (control instanceof ItemControl) {
      // const isBubbling = control.parent instanceof ParentControl && control.parent.isAttentive;

      if (change && typeof change === "object" && "target" in change) {
        const target = change.target;

        if (target && "value" in target) {
          changeValue(target.value as TValue);
        }
      } else {
        changeValue(change);
      }

      if (typeof props.onChange === "function") {
        props.onChange(change, ...others);
      }
    } else {
      throw new Error("control is not an instance of ItemControl");
    }
  };

  return cloneElement(children, {
    ...props,
    value: value ?? "",
    onChange,
  });
}
