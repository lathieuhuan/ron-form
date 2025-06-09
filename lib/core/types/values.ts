import type { BaseControl } from "../base_control";
import type { GroupControl } from "../group_control";
import type { ItemControl } from "../item_control";
import type { ListControl } from "../list_control";

export type GroupValue<T extends Record<string, BaseControl<any>>> = {
  [Key in keyof T]: T[Key] extends ItemControl<infer TValue>
    ? TValue
    : T[Key] extends GroupControl<infer GChild extends Record<string, BaseControl<any>>>
    ? GroupValue<GChild>
    : T[Key] extends ListControl<infer LChild>
    ? ListItemValue<LChild>[]
    : never;
};

export type ListItemValue<T extends BaseControl<any>> = ReturnType<T["getValue"]>;

// export type ListValue<T extends BaseControl<any>> = T extends ItemControl<infer TValue>
//   ? TValue
//   : T extends GroupControl<infer GChild>
//   ? GroupValue<GChild>
//   : T extends ListControl<infer LChild>
//   ? ListValue<LChild>
//   : never;
