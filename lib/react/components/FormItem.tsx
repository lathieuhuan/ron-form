import { cloneElement, SyntheticEvent, useEffect, useState } from "react";

import { BaseControl, NamePath } from "@lib/core";
import { useControl } from "../hooks";

/**
 * - If control is provided:
 *   - If name is provided, the inner control is control.getControl(name).
 *   - If name is empty, the inner control is the provided control.
 * - If control is not provided, the nearest control in the context will be used, follow the above rules.
 */
type FormItemProps = {
  name?: NamePath;
  control?: BaseControl;
  children: JSX.Element;
};

export function FormItem<TValue = unknown>({
  name = [],
  control: controlProp,
  children,
}: FormItemProps) {
  const { props } = children;
  const control = useControl(name, controlProp) as BaseControl<TValue>;
  const [value, setValue] = useState<TValue | undefined>(control.getValue());

  useEffect(() => {
    return control.subscribeValue((value) => setValue(value));
  }, [control]);

  const changeValue = (value: TValue) => {
    control.setValue(value);

    if (!control.getIsTouched()) {
      control.setIsTouched(true);
    }

    control.validate();
    control["notifyValueObservers"]();
    control["notifyStateObservers"]();
  };

  const onChange = (change: Event | SyntheticEvent | TValue, ...others: unknown[]) => {
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
  };

  return cloneElement(children, {
    ...props,
    value,
    onChange,
  });
}
