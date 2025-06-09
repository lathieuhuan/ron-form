import type { BaseControl } from "../base_control";
import type { GroupControl } from "../group_control";
import type { ListControl } from "../list_control";
import type { NamePath } from "./paths";
import type { GroupValue } from "./values";

export type ControlAtGroupPath<
  TControls extends Record<string, BaseControl<any>>,
  TPath extends NamePath,
> = TPath extends [infer Key extends keyof TControls, ...infer TRest extends NamePath]
  ? TRest extends []
    ? TControls[Key] extends GroupControl<infer GChild>
      ? GroupControl<GChild, GroupValue<GChild>>
      : TControls[Key]
    : TControls[Key] extends GroupControl<infer GChild>
    ? ControlAtGroupPath<GChild, TRest>
    : TControls[Key] extends ListControl<infer LChild>
    ? ControlAtListPath<LChild, TRest>
    : never
  : never;

export type ControlAtListPath<TControl, TPath extends NamePath> = TPath extends [
  number,
  ...infer TRest extends NamePath,
]
  ? TRest extends []
    ? TControl | undefined
    : TControl extends GroupControl<infer GChild>
    ? ControlAtGroupPath<GChild, TRest> | undefined
    : TControl extends ListControl<infer LChild extends BaseControl<any>>
    ? ControlAtListPath<LChild, TRest> | undefined
    : never
  : never;
