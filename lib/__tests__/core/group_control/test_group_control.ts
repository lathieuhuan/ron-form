import { BaseControl } from "@lib/core/base_control";
import { GroupControl } from "@lib/core/group_control";
import { GroupValue } from "@lib/core/types";

export class TestGroupControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
> extends GroupControl<TControls, TValue> {
  //
}
