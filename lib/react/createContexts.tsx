import { createContext, ReactElement, useContext, useEffect, useState } from "react";

import {
  DeepKeys,
  DeepValue,
  FieldApi,
  FormControl,
  FieldError,
  FieldErrors,
  FieldMeta,
  type FormApi,
  FormMeta,
} from "@lib/core";
import { useForm } from "./hooks";

export interface UseFormFieldProps<TFormValues, TKey extends DeepKeys<TFormValues>> {
  name: TKey;
}

export interface ReactFieldLooseApi<TFormValues> {
  id: string;
  name: string;
  value: any;
  meta: FieldMeta;
  errorMap: FieldErrors<string>;
  errors: FieldError<string>[];
  form: FormApi<TFormValues>;
  handleChange: (value: any) => void;
  handleBlur: () => void;
}

export interface ReactFieldStrictApi<
  TFormValues,
  TKey extends DeepKeys<TFormValues>,
> extends FieldApi<TFormValues, TKey> {
  id: string;
  name: TKey;
  errors: FieldError<TKey>[];
  form: FormApi<TFormValues>;
  handleChange: (value: DeepValue<TFormValues, TKey>) => void;
  handleBlur: () => void;
}

export type ReactFieldApi<TFormValues, TKey extends string> =
  TKey extends DeepKeys<TFormValues>
    ? ReactFieldStrictApi<TFormValues, TKey>
    : ReactFieldLooseApi<TFormValues>;

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

  function useFormMeta(form: FormApi<TFormValues>) {
    const [state, setState] = useState<FormMeta>(() => form.meta);

    useEffect(() => {
      const unsubscribe = form.subscribeMeta((newMeta) => {
        setState(newMeta);
      });

      return () => {
        unsubscribe();
      };
    }, [form]);

    return state;
  }

  function FormMeta(props: {
    children: (meta: FormMeta, form: FormApi<TFormValues>) => ReactElement;
  }) {
    const form = useContext(FormContext);
    const meta = useFormMeta(form);

    return props.children(meta, form);
  }

  function useFormField<TKey extends DeepKeys<TFormValues>>({
    name,
  }: UseFormFieldProps<TFormValues, TKey>): ReactFieldStrictApi<TFormValues, TKey> {
    const form = useContext(FormContext);

    const [state, setState] = useState<FieldApi<TFormValues, TKey>>(() => {
      return {
        value: form.getFieldValue(name),
        meta: form.getFieldMeta(name),
        errorMap: form.getFieldErrorMap(name),
      };
    });

    useEffect(() => {
      const unsubscribe = form.subscribeField(name, (newField) => {
        setState(newField);
      });

      return () => {
        unsubscribe();
      };
    }, [form, name]);

    const handleChange = (value: DeepValue<TFormValues, TKey>) => {
      form.setFieldValue(name, value);
    };

    const handleBlur = () => {
      if (form.getFieldMeta(name).isTouched) {
        return;
      }

      form.setFieldMeta(name, (prev) => ({
        ...prev,
        isTouched: true,
      }));
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
      handleBlur,
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

    // console.log(`render Field "${name}"`);

    return children(field);
  }

  return {
    FormContext,
    Form,
    FormMeta,
    Field,
    useForm: useForm as typeof useForm<TFormValues>,
    useFormInstance,
    useFormField,
    useFormMeta,
  };
}
