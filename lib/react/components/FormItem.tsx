import { cloneElement, SyntheticEvent, useEffect, useState } from "react";

import { ParentControl } from "@lib/core/parent_control";
import { ItemControl } from "@lib/core/item_control";
import { NamePath } from "@lib/core/types";
import { useControl } from "../hooks";
import { ReactItemControl } from "../types";

/** control is prioritized over name */
type FormItemProps<TValue = unknown> = {
  control?: ReactItemControl<TValue>;
  name?: NamePath;
  children: JSX.Element;
};

export function FormItem<TValue = unknown>({
  control,
  name = [],
  children,
}: FormItemProps<TValue>) {
  const { props } = children;
  const _control = useControl(control ? [] : name, control) as ItemControl<TValue>;
  const [value, setValue] = useState(_control.getValue());

  useEffect(() => {
    return _control?.subscribe((value) => setValue(value));
  }, [_control]);

  const onChange = (change: Event | SyntheticEvent | TValue, ...others: unknown[]) => {
    if (_control instanceof ItemControl) {
      const isBubbling = _control.parent instanceof ParentControl && _control.parent.isAttentive;

      if (change && typeof change === "object" && "target" in change) {
        const target = change.target;

        if (target && "value" in target) {
          _control?.setValue(target.value as TValue);
          _control?.validate({ isBubbling });
        }
      } else {
        _control?.setValue(change);
        _control?.validate({ isBubbling });
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
