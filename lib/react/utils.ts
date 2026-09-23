import type { DeepNames, FieldArrayApi, FormApi, FormControl } from "@lib/core";
import { FieldArrayControl } from "@lib/core";

type FieldArrayProps<TFormValues, TKey extends DeepNames<TFormValues>> = {
  name: TKey;
  form: FormApi<TFormValues>;
};

export function fieldArray<TFormValues, TKey extends DeepNames<TFormValues>>(
  props: FieldArrayProps<TFormValues, TKey>,
): FieldArrayApi<TFormValues, TKey> {
  return new FieldArrayControl(props.name, props.form as FormControl<TFormValues>);
}
