import { useEffect, useState } from "react";

import { BaseControl, ControlState, NamePath } from "@lib/core";
import { useControl } from "./useControl";

export function useFieldState(name: NamePath, control?: BaseControl<unknown>) {
  const _control = useControl(name, control) as BaseControl<unknown>;
  const [state, setState] = useState<ControlState>(_control.getState());

  useEffect(() => {
    return _control.subscribeState(setState);
  }, [_control]);

  return state;
}
