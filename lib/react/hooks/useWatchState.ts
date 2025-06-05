import { useEffect, useState } from "react";

import { BaseControl } from "@lib/core/base_control";
import { ControlState, NamePath } from "@lib/core/types";
import { ReactBaseControl } from "../types";
import { useControl } from "./useControl";

export function useWatchState(name: NamePath, control?: ReactBaseControl<unknown>) {
  const _control = useControl(name, control) as BaseControl<unknown>;
  const [state, setState] = useState<ControlState>(_control.getState());

  useEffect(() => {
    return _control.subscribeState(setState);
  }, [_control]);

  return state;
}
