import { createContext, useContext, useEffect, useState } from "react";

import { DeepKeys, DeepValue } from "@lib/core";
import { Field, FormControl, FormError } from "@lib/core/FormControl";
import { useForm } from "./hooks";

export function createContexts<TFormValues>() {
  const FormContext = createContext<FormControl<TFormValues>>(new FormControl<TFormValues>());

  function Form(props: { form: FormControl<TFormValues>; children?: React.ReactNode }) {
    return <FormContext.Provider value={props.form}>{props.children}</FormContext.Provider>;
  }

  interface FieldChildrenProps<TFormValues, TKey extends DeepKeys<TFormValues>> extends Field<
    TFormValues,
    TKey
  > {
    id: string;
    name: TKey;
    errors: FormError<TKey>[];
    onChange: (value: DeepValue<TFormValues, TKey>) => void;
  }

  interface FieldProps<TKey extends DeepKeys<TFormValues>> {
    name: TKey;
    children?: (props: FieldChildrenProps<TFormValues, TKey>) => React.ReactElement;
  }

  function Field<TKey extends DeepKeys<TFormValues>>({ name, children }: FieldProps<TKey>) {
    const form = useContext(FormContext);
    const [state, setState] = useState<Field<TFormValues, TKey>>(() => {
      const errorMap = form.getFieldErrorMap(name);

      return {
        value: form.getFieldValue(name),
        meta: form.getFieldMeta(name),
        errorMap,
      };
    });

    useEffect(() => {
      const unsubscribe = form.subscribe(name)((newField) => {
        setState(newField);
      });

      return () => {
        unsubscribe();
      };
    }, [form, name]);

    const onChange = (value: DeepValue<TFormValues, TKey>) => {
      form.setFieldValue(name, value);
    };

    if (children == null) {
      return null;
    }

    return children({
      id: name,
      name,
      value: state.value,
      meta: state.meta,
      errorMap: state.errorMap,
      get errors() {
        const { errorMap } = state;

        return [
          ...errorMap.change,
          ...errorMap.blur,
          ...errorMap.changeAsync,
          ...errorMap.blurAsync,
        ];
      },
      onChange,
    });
  }

  function useFormInstance() {
    return useContext(FormContext);
  }

  return {
    FormContext,
    Form,
    Field,
    useForm: useForm as typeof useForm<TFormValues>,
    useFormInstance,
  };
}
