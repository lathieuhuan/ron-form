import { BaseControl } from "./controls/BaseControl";
import { FormControl } from "./controls/FormControl";
import { GroupControl } from "./controls/GroupControl";
import { ItemControl } from "./controls/ItemControl";
import { ListControl, ListControlItem } from "./controls/ListControl";
import { GroupValue, ListItemValue } from "./types";

function item<TValue = unknown>(...args: ConstructorParameters<typeof ItemControl<TValue>>) {
  return new ItemControl(...args);
}

function form<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
>(...args: ConstructorParameters<typeof FormControl<TControls, TValue>>) {
  return new FormControl(...args);
}

function group<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
>(...args: ConstructorParameters<typeof GroupControl<TControls, TValue>>) {
  return new GroupControl(...args);
}

function list<
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
  return new ListControl(...args);
}

export const r = {
  form,
  item,
  group,
  list,
};
