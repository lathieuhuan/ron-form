import type { BaseControl } from "@lib/core/controls/BaseControl";
import type { NamePath } from "@lib/core/types";
import { GroupControl } from "@lib/core/controls/GroupControl";
import { ListControl } from "@lib/core/controls/ListControl";

export function getControl<TValue = any>(
  parent?: BaseControl<TValue>,
  name: NamePath = [],
): BaseControl<any> | undefined {
  if (parent && name.length) {
    const first = name.at(0)!;
    const rest = name.slice(1);
    if (parent instanceof GroupControl) {
      return getControl(parent.controls[first], rest);
    }
    if (parent instanceof ListControl) {
      const item = parent["items"].at(+first);
      return getControl(item?.control, rest);
    }
  }
  return parent;
}
