import { BaseControl, ListControl, ListItemValue } from "@lib/core";
import { ListControlItem } from "@lib/core/controls/ListControl";
import { ReactListControl } from "../types";

export function buildList<
  TChildControl extends BaseControl<any> = BaseControl<any>,
  TItemValue extends ListItemValue<TChildControl> = ListItemValue<TChildControl>,
  TValue extends (TItemValue | undefined)[] = (TItemValue | undefined)[],
  TListItem extends ListControlItem<TItemValue, TChildControl> = ListControlItem<
    TItemValue,
    TChildControl
  >,
>(
  ...args: ConstructorParameters<typeof ListControl<TChildControl, TItemValue, TValue, TListItem>>
) {
  return new ListControl<TChildControl, TItemValue, TValue, TListItem>(...args) as ReactListControl<
    TChildControl,
    TItemValue,
    TValue,
    TListItem
  >;
}
