import { useContext } from "react";

import { NamePath } from "@lib/core/types";
import { FormContext } from "../contexts/form-context";
import { ReactBaseControl } from "../types";

/**
 * @returns the control itself if name is empty,
 * return higher control if control is also undefined
 */
export function useControl<TControl extends ReactBaseControl = ReactBaseControl>(
  name: NamePath,
  control?: TControl,
): TControl {
  const higherControl = useContext(FormContext);
  const parent = control ?? higherControl;
  const _control = parent?.getControl(name);

  if (!_control) {
    throw new Error("Control is not found");
  }
  return _control as TControl;
}
