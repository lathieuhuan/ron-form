import { BaseControl, GroupControl, GroupValue } from "@lib/core";
import { ReactGroupControl } from "../types";

export function buildGroup<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
>(...args: ConstructorParameters<typeof GroupControl<TControls, TValue>>) {
  return new GroupControl<TControls, TValue>(...args) as ReactGroupControl<TControls, TValue>;
}
