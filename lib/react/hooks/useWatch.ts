import { useEffect, useState } from "react";

import { BaseControl, NamePath } from "@lib";
import { ReactBaseControl } from "../types";
import { useChildControl } from "./useChildControl";

export function useWatch<TValue = unknown>(name: NamePath, control?: ReactBaseControl<TValue>) {
  const _control = useChildControl(name, control) as BaseControl<TValue>;
  const [value, setValue] = useState<TValue | undefined>(_control.getValue());

  useEffect(() => {
    return _control?.subscribeValue(setValue);
  }, [_control]);

  return value;
}
