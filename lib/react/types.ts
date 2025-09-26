import { BaseControl } from "@lib/core/controls/BaseControl";
import { GroupControl } from "@lib/core/controls/GroupControl";
import { ItemControl } from "@lib/core/controls/ItemControl";
import { ListControl, ListControlItem } from "@lib/core/controls/ListControl";
import { ParentControl } from "@lib/core/controls/ParentControl";
import { FormControl } from "@lib/core/form_control";
import { GroupValue, ListItemValue } from "@lib/core/types";

type TurnReadonly<T, K extends keyof T> = Omit<T, K> & {
  readonly [P in K]: T[P];
};

type OmittedProps = "name";

// type TransfromProps = {
//   getControl(path: NamePath): ReactBaseControl<any>;
// };

type ReactControl<TControl extends BaseControl<any>> = Omit<
  TurnReadonly<TControl, "parent">,
  OmittedProps
>;

export type ReactBaseControl<TValue = any> = ReactControl<BaseControl<TValue>>;

export type ReactItemControl<TValue = any> = ReactControl<ItemControl<TValue>>;

export type ReactParentControl<TValue = any> = ReactControl<ParentControl<TValue>>;

export type ReactGroupControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls>,
> = ReactControl<GroupControl<TControls, TValue>>;

export type ReactListControl<
  TChildControl extends BaseControl<any> = BaseControl<any>,
  TItemValue extends ListItemValue<TChildControl> = ListItemValue<TChildControl>,
  TValue extends (TItemValue | undefined)[] = (TItemValue | undefined)[],
  TListItem extends ListControlItem<TItemValue, TChildControl> = ListControlItem<
    TItemValue,
    TChildControl
  >,
> = ReactControl<ListControl<TChildControl, TItemValue, TValue, TListItem>>;

export type ReactFormControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls>,
> = ReactControl<FormControl<TControls, TValue>>;

export type ReactControlValue<TControl extends ReactBaseControl> =
  TControl extends ReactBaseControl<infer TValue> ? TValue : never;
