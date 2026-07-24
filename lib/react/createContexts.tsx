import type { DeepKeys, FormApi, FormMeta } from "@lib/core";
import type { ReactFieldStrictApi } from "./types";

import { FormControl } from "@lib/core";
import { createContext, ReactElement, useContext, useSyncExternalStore } from "react";
import { useForm } from "./hooks";
import { useField } from "./hooks/useField";

export interface UseFormFieldProps<TFormValues, TKey extends DeepKeys<TFormValues>> {
  name: TKey;
  form: FormApi<TFormValues>;
}

export interface FieldProps<TFormValues, TKey extends DeepKeys<TFormValues>> {
  name: TKey;
  children?: (props: ReactFieldStrictApi<TFormValues, TKey>) => React.ReactElement;
}

export function createContexts<TFormValues>() {
  const FormContext = createContext<FormApi<TFormValues>>(new FormControl<TFormValues>());

  function useFormInstance() {
    return useContext(FormContext);
  }

  function Form(props: { form: FormApi<TFormValues>; children?: React.ReactNode }) {
    return <FormContext.Provider value={props.form}>{props.children}</FormContext.Provider>;
  }

  function FormMeta(props: {
    children: (meta: FormMeta, form: FormApi<TFormValues>) => ReactElement;
  }) {
    const form = useContext(FormContext);
    const meta = useSyncExternalStore(form.meta.subscribe, form.meta.get);

    return props.children(meta, form);
  }

  function Field<TKey extends DeepKeys<TFormValues>>({
    name,
    children,
  }: FieldProps<TFormValues, TKey>) {
    const form = useContext(FormContext);
    const field = useField({ name, form });

    if (children == null) {
      return null;
    }

    // console.log(`render Field "${name}"`);

    const handleChange: typeof field.handleChange = (value, options) => {
      field.handleChange(value, {
        cause: options?.cause || "user",
      });
    };

    return children({
      ...field,
      handleChange,
    });
  }

  return {
    FormContext,
    Form,
    FormMeta,
    Field,
    useForm: useForm as typeof useForm<TFormValues>,
    useFormInstance,
  };
}
