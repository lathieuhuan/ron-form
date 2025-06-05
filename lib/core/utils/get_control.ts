import type { BaseControl } from "../base_control";
import type { NamePath } from "../types";
import { GroupControl } from "../group_control";
import { ListControl } from "../list_control";

export function getControl(parent?: BaseControl, name: NamePath = []): BaseControl | undefined {
  if (parent && name.length) {
    const first = name.at(0)!;
    const rest = name.slice(1);
    if (parent instanceof GroupControl) {
      return getControl(parent.controls[first], rest);
    }
    if (parent instanceof ListControl) {
      const item = parent.items.at(+first);
      return getControl(item?.control, rest);
    }
  }
  return parent;
}
