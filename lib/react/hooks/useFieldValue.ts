import { useEffect, useState } from "react";

import { BaseControl, NamePath } from "@lib/core";
import { useControl } from "./useControl";

export function useFieldValue<TValue = unknown>(name: NamePath, control?: BaseControl<TValue>) {
  const _control = useControl<BaseControl<TValue>>(name, control);
  const [value, setValue] = useState<TValue | undefined>(_control.getValue());

  useEffect(() => {
    return _control?.subscribeValue(setValue);
  }, [_control]);

  return value;
}
