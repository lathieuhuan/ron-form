import type { BaseControl } from "../base_control";
import type { GroupControl } from "../group_control";
import type { ItemControl } from "../item_control";
import type { ListControl } from "../list_control";

export type NamePath = (string | number)[];

export type GroupPath<TControls> = TControls extends Record<infer Key, BaseControl<any>>
  ? Key extends string
    ? TControls[Key] extends ItemControl<any>
      ? [Key]
      : TControls[Key] extends GroupControl<infer GChild>
      ? [Key] | [Key, ...GroupPath<GChild>]
      : TControls[Key] extends ListControl<infer LChild>
      ? [Key] | [Key, ...ListPath<LChild>]
      : never
    : never
  : never;

export type ListPath<TControl extends BaseControl<any>> = TControl extends ItemControl
  ? [number]
  : TControl extends GroupControl<infer GChild>
  ? [number] | [number, ...GroupPath<GChild>]
  : TControl extends ListControl<infer LChild>
  ? [number] | [number, ...ListPath<LChild>]
  : TControl extends ItemControl<any>
  ? [number]
  : never;
