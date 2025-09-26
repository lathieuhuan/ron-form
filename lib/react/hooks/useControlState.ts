import { useEffect, useState } from "react";

import { BaseControl, ControlState, NamePath } from "@lib/core";
import { ReactBaseControl } from "../types";
import { useChildControl } from "./useChildControl";

export function useControlState(name: NamePath, control?: ReactBaseControl<unknown>) {
  const _control = useChildControl(name, control) as BaseControl<unknown>;
  const [state, setState] = useState<ControlState>(_control.getState());

  useEffect(() => {
    return _control.subscribeState(setState);
  }, [_control]);

  return state;
}
