import { BaseControl } from "@lib/core/base_control";
import { FormControl } from "@lib/core/form_control";
import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { ListControl } from "@lib/core/list_control";
import { ParentControlOptions } from "@lib/core/parent_control";
import {
  ComposableAsyncValidators,
  ComposableValidators,
  GroupValue,
  ListValue,
} from "@lib/core/types";
import {
  ReactBaseControl,
  ReactFormControl,
  ReactGroupControl,
  ReactItemControl,
  ReactListControl,
} from "./types";

type ToCore<TControls> = {
  [K in keyof TControls]: TControls[K] extends ReactBaseControl<infer TValue>
    ? BaseControl<TValue>
    : never;
};

export const r = {
  form<
    TControls extends Record<string, ReactBaseControl<any>>,
    TValue extends GroupValue<TControls>,
  >(
    controls: TControls,
    validators: ComposableValidators<TValue> | null = null,
    asyncValidators: ComposableAsyncValidators<TValue> | null = null,
  ) {
    return new FormControl<ToCore<TControls>, TValue>(
      controls as unknown as ToCore<TControls>,
      validators,
      asyncValidators,
    ) as unknown as ReactFormControl<TControls, TValue>;
  },
  group<
    TControls extends Record<string, ReactBaseControl<any>>,
    TValue extends GroupValue<TControls>,
  >(
    controls: TControls,
    validators: ComposableValidators<TValue> | null = null,
    asyncValidators: ComposableAsyncValidators<TValue> | null = null,
    options: ParentControlOptions = {},
  ) {
    return new GroupControl<TControls, TValue>(
      controls as unknown as Record<string, BaseControl<any>>,
      validators,
      asyncValidators,
      options,
    ) as unknown as ReactGroupControl<TControls, TValue>;
  },
  list<TChildControl extends ReactBaseControl<any>, TValue extends ListValue<TChildControl>>(
    sampleControl: TChildControl,
    validators: ComposableValidators<TValue[]> | null = null,
    asyncValidators: ComposableAsyncValidators<TValue[]> | null = null,
    options: ParentControlOptions = {},
  ) {
    return new ListControl<TChildControl, TValue>(
      sampleControl as unknown as BaseControl<any>,
      validators,
      asyncValidators,
      options,
    ) as unknown as ReactListControl<TChildControl, TValue>;
  },
  item<TValue = unknown>(...args: ConstructorParameters<typeof ItemControl<TValue>>) {
    return new ItemControl<TValue>(...args) as unknown as ReactItemControl<TValue>;
  },
};
