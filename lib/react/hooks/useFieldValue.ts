import { useEffect, useState } from "react";

import { BaseControl, NamePath } from "@lib/core";
import { useControl } from "./useControl";

export function useFieldValue<TValue = unknown>(name: NamePath, control?: BaseControl<TValue>) {
  const _control = useControl(name, control as BaseControl<unknown>) as BaseControl<TValue>;
  const [value, setValue] = useState<TValue | undefined>(_control.getValue());

  useEffect(() => {
    return _control?.subscribeValue(setValue);
  }, [_control]);

  return value;
}
