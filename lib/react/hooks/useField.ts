import { useEffect, useState } from "react";

import type { DeepKeys, FieldError, FieldState, FormControl } from "@lib/core";
import type { UseFormFieldProps } from "../createContexts";
import type { ReactFieldStrictApi } from "../types";

import { ERROR_CAUSES, FieldControl } from "@lib/core";

export function useField<TFormValues, TKey extends DeepKeys<TFormValues>>({
  name,
  form,
}: UseFormFieldProps<TFormValues, TKey>): ReactFieldStrictApi<TFormValues, TKey> {
  const [api, setApi] = useState(() => {
    return new FieldControl(form as FormControl<TFormValues>, name);
  });
  const [state, setState] = useState<FieldState<TFormValues, TKey>>(() => {
    return form.getFieldState(name);
  });

  useEffect(() => {
    let newApi = api;

    if (api.form !== form || api.name !== name) {
      newApi = new FieldControl(form as FormControl<TFormValues>, name);
      setApi(newApi);
    }

    const value = form.getFieldValue(name);
    const meta = form.getFieldMeta(name);

    if (value !== state.value || meta !== state.meta) {
      setState({ value, meta });
    }

    return form.subscribeField(name, setState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, name]);

  return {
    id: name,
    name,
    value: state.value,
    meta: state.meta,
    form,
    get errors() {
      return ERROR_CAUSES.reduce<FieldError<TKey>[]>((acc, cause) => {
        const errors = state.meta.errors[cause] || [];
        acc.push(...(errors as FieldError<TKey>[]));
        return acc;
      }, []);
    },
    handleChange: api.handleChange,
    handleBlur: api.handleBlur,
  };
}
