import { cloneElement, SyntheticEvent, useEffect, useState } from "react";

import { BaseControl, ItemControl, NamePath } from "@lib/core";
import { useControl } from "../hooks";

/**
 * - If control is provided:
 *   - If name is provided, the inner control is control.getControl(name).
 *   - If name is empty, the inner control is the provided control.
 * - If control is not provided, the nearest control in the context will be used, follow the above rules.
 */
type FormItemProps<TValue = unknown> = {
  name?: NamePath;
  control?: BaseControl<TValue>;
  children: JSX.Element;
  changeEventProp?: string;
};

/** Work on ItemControl */
export function FormItem<TValue = unknown>({
  name = [],
  control: controlProp,
  children,
  changeEventProp = "onChange",
}: FormItemProps<TValue>) {
  const { props } = children;
  const control = useControl<BaseControl<TValue>>(name, controlProp);
  const [value, setValue] = useState<TValue | undefined>(control.getValue());

  if (!(control instanceof ItemControl)) {
    throw new Error("FormItem control must be an ItemControl");
  }

  useEffect(() => {
    return control.subscribeValue((value) => setValue(value));
  }, [control]);

  const changeValue = (value: TValue) => {
    control["handleValueChangeByUser"](value);
  };

  const handleChange = (change: Event | SyntheticEvent | TValue, ...others: unknown[]) => {
    if (change && typeof change === "object" && "target" in change) {
      const target = change.target;

      if (target && "value" in target) {
        changeValue(target.value as TValue);
      }
    } else {
      changeValue(change);
    }

    if (typeof props[changeEventProp] === "function") {
      props[changeEventProp](change, ...others);
    }
  };

  return cloneElement(children, {
    ...props,
    value,
    [changeEventProp]: handleChange,
  });
}
