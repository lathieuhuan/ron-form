import { BaseControl } from "@lib/core/base_control";
import { FormControl } from "@lib/core/form_control";
import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { ListControl } from "@lib/core/list_control";
import { GroupValue, ListValue, NamePath } from "@lib/core/types";

type ReadonlyProps<T, K extends keyof T> = Omit<T, K> & {
  readonly [P in K]: T[P];
};

type OmittedProps =
  | "name"
  | "controls"
  | "isValid"
  | "isPending"
  | "isTouched"
  | "isAttentive"
  | "controlSet"
  | "setIsTouched"
  | "notifyObservers"
  | "notifyStateObservers"
  | "subscribe"
  | "subscribeState"
  | "checkIsValid"
  | "connectForm"
  | "handleSubmit"
  | "handleValidateResult";

// type TransfromProps = {
//   getControl(path: NamePath): ReactBaseControl<any>;
// };

type ReactControl<TControl extends BaseControl<any>> = Omit<
  ReadonlyProps<TControl, "parent" | "errors">,
  OmittedProps
>;

export type ReactBaseControl<TValue = any> = ReactControl<BaseControl<TValue>>;

export type ReactItemControl<TValue = any> = ReactControl<ItemControl<TValue>>;

export type ReactGroupControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls>,
> = ReactControl<GroupControl<TControls, TValue>>;

export type ReactListControl<
  TChildControl extends BaseControl<any>,
  TValue extends ListValue<TChildControl>,
> = ReactControl<ListControl<TChildControl, TValue>>;

export type ReactFormControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls>,
> = ReactControl<FormControl<TControls, TValue>>;

export type ReactControlValue<TControl extends ReactBaseControl> =
  TControl extends ReactBaseControl<infer TValue> ? TValue : never;
