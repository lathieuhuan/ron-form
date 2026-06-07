import { createContext, useContext, useEffect, useState } from "react";

import { DeepKeys, DeepValue } from "@lib/core";
import { Field, FormControl } from "@lib/core/FormControl";
import { useForm } from "./hooks";

export function createContexts<TFormValues>() {
  const FormContext = createContext<FormControl<TFormValues>>(new FormControl<TFormValues>());

  function Form(props: { form: FormControl<TFormValues>; children?: React.ReactNode }) {
    return <FormContext.Provider value={props.form}>{props.children}</FormContext.Provider>;
  }

  type FieldProps<TKey extends DeepKeys<TFormValues>> = {
    name: TKey;
    children?: (props: {
      name: TKey;
      value: DeepValue<TFormValues, TKey>;
      onChange: (value: DeepValue<TFormValues, TKey>) => void;
    }) => React.ReactElement;
  };

  function Field<TKey extends DeepKeys<TFormValues>>({ name, children }: FieldProps<TKey>) {
    const form = useContext(FormContext);
    const [field, setField] = useState<Field<DeepValue<TFormValues, TKey>>>(() => ({
      value: form.getFieldValue(name),
      meta: form.getFieldMeta(name),
    }));

    useEffect(() => {
      const unsubscribe = form.subscribe(name)((newField) => {
        setField(newField);
      });

      return () => {
        unsubscribe();
      };
    }, [form, name]);

    const onChange = (value: DeepValue<TFormValues, TKey>) => {
      form.setFieldValue(name, value);
    };

    return children == null
      ? null
      : children({
          name,
          value: field.value,
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
