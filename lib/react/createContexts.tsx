import { createContext, useContext, useEffect, useState } from "react";

import { DeepKeys, DeepValue, FieldApi, FormControl, FieldError } from "@lib/core";
import { useForm } from "./hooks";

export interface UseFormFieldProps<TFormValues, TKey extends DeepKeys<TFormValues>> {
  name: TKey;
}

export interface ReactFieldApi<TFormValues, TKey extends DeepKeys<TFormValues>> extends FieldApi<
  TFormValues,
  TKey
> {
  id: string;
  name: TKey;
  errors: FieldError<TKey>[];
  form: FormControl<TFormValues>;
  handleChange: (value: DeepValue<TFormValues, TKey>) => void;
}

export interface FieldProps<TFormValues, TKey extends DeepKeys<TFormValues>> {
  name: TKey;
  children?: (props: ReactFieldApi<TFormValues, TKey>) => React.ReactElement;
}

export function createContexts<TFormValues>() {
  const FormContext = createContext<FormControl<TFormValues>>(new FormControl<TFormValues>());

  function useFormInstance() {
    return useContext(FormContext);
  }

  function Form(props: { form: FormControl<TFormValues>; children?: React.ReactNode }) {
    return <FormContext.Provider value={props.form}>{props.children}</FormContext.Provider>;
  }

  function useFormField<TKey extends DeepKeys<TFormValues>>({
    name,
  }: UseFormFieldProps<TFormValues, TKey>): ReactFieldApi<TFormValues, TKey> {
    const form = useContext(FormContext);

    const [state, setState] = useState<FieldApi<TFormValues, TKey>>(() => {
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

    const handleChange = (value: DeepValue<TFormValues, TKey>) => {
      form.setFieldValue(name, value);
    };

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
      handleChange,
    };
  }

  function Field<TKey extends DeepKeys<TFormValues>>({
    name,
    children,
  }: FieldProps<TFormValues, TKey>) {
    const field = useFormField({ name });

    if (children == null) {
      return null;
    }

    return children(field);
  }

  return {
    FormContext,
    Form,
    Field,
    useForm: useForm as typeof useForm<TFormValues>,
    useFormInstance,
    useFormField,
  };
}
