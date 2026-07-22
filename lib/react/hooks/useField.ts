import { useEffect, useState } from "react";

import type { DeepKeys, FieldState, FormControl } from "@lib/core";
import type { ReactFieldStrictApi, UseFormFieldProps } from "../createContexts";

import { FieldControl } from "@lib/core";

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
    const errorMap = form.getFieldErrorMap(name);

    if (value !== state.value || meta !== state.meta || errorMap !== state.errorMap) {
      setState({ value, meta, errorMap });
    }

    const unsubscribe = form.subscribeField(name, (newField) => {
      setState(newField);
    });

    return () => {
      unsubscribe();
    };
  }, [form, name]);

  return {
    id: name,
    name,
    value: state.value,
    meta: state.meta,
    errorMap: state.errorMap,
    form,
    get errors() {
      const { errorMap } = state;
      const { change = [], blur = [], changeAsync = [], blurAsync = [] } = errorMap;

      return change.concat(blur, changeAsync, blurAsync);
    },
    handleChange: api.handleChange,
    handleBlur: api.handleBlur,
  };
}
