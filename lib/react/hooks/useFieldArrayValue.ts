import { DeepItemValue, DeepKeys, FormApi } from "@lib/core";
import { DependencyList, useEffect, useState } from "react";

export type CompareFunction<TFormValues, TKey extends DeepKeys<TFormValues>> = (
  newItem: DeepItemValue<TFormValues, TKey>,
  oldItem: DeepItemValue<TFormValues, TKey>,
  index: number,
  newValue: DeepItemValue<TFormValues, TKey>[],
  oldValue: DeepItemValue<TFormValues, TKey>[],
) => boolean;

const defaultCompare: CompareFunction<any, any> = (newItem, oldItem) => newItem === oldItem;

export interface UseFieldArrayValueProps<TFormValues, TKey extends DeepKeys<TFormValues>> {
  name: TKey;
  form: FormApi<TFormValues>;
  compare?: CompareFunction<TFormValues, TKey>;
  deps?: DependencyList;
}

export function useFieldArrayValue<TFormValues, TKey extends DeepKeys<TFormValues>>({
  name,
  form,
  compare = defaultCompare,
  deps = [],
}: UseFieldArrayValueProps<TFormValues, TKey>) {
  const [value, setValue] = useState(
    () => form.getFieldValue(name) as DeepItemValue<TFormValues, TKey>[],
  );

  useEffect(
    () => {
      return form.subscribeFieldValue(name, (data) => {
        const value = data.value as DeepItemValue<TFormValues, TKey>[];
        const oldValue = data.oldValue as DeepItemValue<TFormValues, TKey>[];

        if (
          value.length !== oldValue.length ||
          value.some((item, index) => !compare(item, oldValue[index], index, value, oldValue))
        ) {
          setValue(value);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form, name, ...deps],
  );

  return value;
}
