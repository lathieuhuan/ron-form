import { useContext } from "react";

import { BaseControl, NamePath, ParentControl } from "@lib/core";
import { FormContext } from "../contexts/FormContext";

function getControl(parent: BaseControl<any>, name: NamePath): BaseControl<any> | undefined {
  return parent instanceof ParentControl && name.length ? parent.getControl(name) : parent;
}

/**
 * - If control is provided:
 *   - If name is provided, returns control.getControl(name).
 *   - If name is empty, returns the provided control.
 * - If control is not provided, the nearest control in the context will be used as control, then follow the above rules.
 */
export function useControl<TControl extends BaseControl<any> = BaseControl>(
  name: NamePath,
  control?: BaseControl<any>,
): TControl {
  const higherControl = useContext(FormContext);
  const _control = getControl(control ?? higherControl, name);

  if (!_control) {
    throw new Error(`Control not found for name: ${name.join(".")}`);
  }

  return _control as TControl;
}
