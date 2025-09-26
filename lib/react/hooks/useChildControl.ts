import { NamePath } from "@lib/core/types";
import { ReactBaseControl } from "../types";
import { useControl } from "./useControl";

function getControl(parent: ReactBaseControl, name: NamePath): ReactBaseControl {
  return "getControl" in parent && typeof parent.getControl === "function" && name.length
    ? parent.getControl(name)
    : parent;
}

/**
 * @returns the control itself if name is empty,
 * return higher control if control is also undefined
 */
export function useChildControl<TControl extends ReactBaseControl = ReactBaseControl>(
  name: NamePath,
  control?: TControl,
) {
  const parent = useControl(control);
  const _control = getControl(parent, name);

  return _control;
}
