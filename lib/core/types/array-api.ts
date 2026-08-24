import type { ChangeCause } from "./form-api";
import type { DeepKeys, DeepValue } from "./key-value";

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

  remove(index: number, options?: ArrayUpdateOptions): TItemValue[] | null;

  move(fromIndex: number, toIndex: number, options?: ArrayUpdateOptions): TItemValue[] | null;

  swap(indexA: number, indexB: number, options?: ArrayUpdateOptions): TItemValue[] | null;
}
