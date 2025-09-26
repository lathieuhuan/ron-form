import { BaseControl, FormControl, GroupValue } from "@lib/core";
import { ReactFormControl } from "../types";

export function buildForm<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
>(...args: ConstructorParameters<typeof FormControl<TControls, TValue>>) {
  return new FormControl<TControls, TValue>(...args) as ReactFormControl<TControls, TValue>;
}
