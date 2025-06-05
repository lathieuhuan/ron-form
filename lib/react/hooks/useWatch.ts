import { useEffect, useState } from "react";

import { BaseControl } from "@lib/core/base_control";
import { NamePath } from "@lib/core/types";
import { ReactBaseControl } from "../types";
import { useControl } from "./useControl";

export function useWatch<TValue = unknown>(name: NamePath, control?: ReactBaseControl<TValue>) {
  const _control = useControl(name, control) as BaseControl<TValue>;
  const [value, setValue] = useState(_control.getValue());

  useEffect(() => {
    return _control?.subscribe((value) => setValue(value));
  }, [_control]);

  return value;
}
