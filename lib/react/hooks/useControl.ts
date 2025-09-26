import { useContext } from "react";

import { FormContext } from "../contexts/form-context";
import { ReactBaseControl } from "../types";

/**
 * @returns the control in the nearest context. If the control itself if provided.
 */
export function useControl<TControl extends ReactBaseControl = ReactBaseControl>(
  control?: TControl,
) {
  const higherControl = useContext(FormContext);
  return control ?? higherControl;
}
