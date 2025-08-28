import type { BaseControl } from "../controls/BaseControl";
import type { GroupControl } from "../controls/GroupControl";
import type { ItemControl } from "../controls/ItemControl";
import type { ListControl } from "../controls/ListControl";

export type GroupValue<T extends Record<string, BaseControl<any>>> = {
  [Key in keyof T]: T[Key] extends ItemControl<infer TValue>
    ? TValue | undefined
    : T[Key] extends GroupControl<infer GChild extends Record<string, BaseControl<any>>>
    ? GroupValue<GChild>
    : T[Key] extends ListControl<infer LChild>
    ? ListItemValue<LChild>[]
    : never;
};

export type ListItemValue<T extends BaseControl<any>> = ReturnType<T["getValue"]>;

// export type ListValue<TValue> = (TValue | undefined)[] | undefined;

// This will cause: Type instantiation is excessively deep and possibly infinite.ts(2589)
// export type ListItemValue<T extends BaseControl<any>> = T extends ItemControl<infer TValue>
//   ? TValue
//   : T extends GroupControl<infer GChild>
//   ? GroupValue<GChild>
//   : T extends ListControl<infer LChild>
//   ? ListValue<LChild>
//   : never;
