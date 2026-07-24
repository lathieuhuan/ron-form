import type { DeepKeys, DeepValue } from "./key-value";
import type { ChangeCause } from "./form-api";

export type ArrayChangeData<TFormValues, TField extends DeepKeys<TFormValues>> = {
  value: DeepValue<TFormValues, TField>;
};

export type ArrayUpdateOptions = {
  /** If true, validate the array, does not validate the items. Default false */
  dontValidate?: boolean;
  cause?: ChangeCause;
};

export interface FieldArrayApi<
  TFormValues,
  TField extends DeepKeys<TFormValues>,
  TItemValue = DeepValue<TFormValues, TField> extends Array<infer TItem> ? TItem : never,
> {
  value: TItemValue[];

  insert(value: TItemValue, index?: number, options?: ArrayUpdateOptions): TItemValue[] | null;
}
