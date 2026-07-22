import { useEffect, useState } from "react";

import type { DeepKeys, DeepValue, FormApi } from "@lib/core";

export interface UseFieldValueProps<TFormValues, TKey extends DeepKeys<TFormValues>> {
  name: TKey;
  form: FormApi<TFormValues>;
}

export function useFieldValue<TFormValues, TKey extends DeepKeys<TFormValues>>({
  name,
  form,
}: UseFieldValueProps<TFormValues, TKey>): DeepValue<TFormValues, TKey> {
  const [value, setValue] = useState(() => form.getFieldValue(name));

  useEffect(() => {
    return form.subscribeFieldValue(name, ({ value }) => {
      setValue(value);
    });
  }, [form, name]);

  return value;
}
