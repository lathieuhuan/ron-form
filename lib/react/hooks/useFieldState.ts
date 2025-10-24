import { useEffect, useState } from "react";

import { BaseControl, NamePath } from "@lib/core";
import { useControl } from "./useControl";

export function useFieldState(name: NamePath, control?: BaseControl<any>) {
  const _control = useControl(name, control);
  const [state, setState] = useState(_control.getState());

  useEffect(() => {
    return _control.subscribeState(setState);
  }, [_control]);

  return state;
}
