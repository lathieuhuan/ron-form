import { useContext } from "react";

import { BaseControl, NamePath } from "@lib/core";
import { FormContext } from "../contexts/form-context";

function getControl(parent: BaseControl<any>, name: NamePath): BaseControl {
  return "getControl" in parent && typeof parent.getControl === "function" && name.length
    ? parent.getControl(name)
    : parent;
}

/**
 * - If control is provided:
 *   - If name is provided, returns control.getControl(name).
 *   - If name is empty, returns the provided control.
 * - If control is not provided, the nearest control in the context will be used as control, then follow the above rules.
 */
export function useControl<TValue = unknown>(name: NamePath, control?: BaseControl<TValue>) {
  const higherControl = useContext(FormContext);
  return getControl(control ?? higherControl, name);
}
