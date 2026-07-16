import type {
  DeepKeys,
  DeepValue,
  FieldError,
  FieldErrors,
  FieldMeta,
  FieldState,
  FormApi,
  FormMeta,
  HandleChangeOptions,
} from "@lib/core";

import { FormControl } from "@lib/core";
import {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { useForm } from "./hooks";
import { useFormField } from "./hooks/useFormField";

export interface UseFormFieldProps<TFormValues, TKey extends DeepKeys<TFormValues>> {
  name: TKey;
  form: FormApi<TFormValues>;
}

export interface ReactFieldLooseApi<TFormValues> {
  id: string;
  name: string;
  value: any;
  meta: FieldMeta;
  errorMap: FieldErrors<string>;
  errors: FieldError<string>[];
  form: FormApi<TFormValues>;
  handleChange(value: any, options?: HandleChangeOptions): void;
  handleBlur(): void;
}

export interface ReactFieldStrictApi<
  TFormValues,
  TKey extends DeepKeys<TFormValues> = DeepKeys<TFormValues>,
> extends FieldState<TFormValues, TKey> {
  id: string;
  name: TKey;
  errors: FieldError<TKey>[];
  form: FormApi<TFormValues>;
  handleChange(value: DeepValue<TFormValues, TKey>, options?: HandleChangeOptions): void;
  handleBlur(): void;
}

export type ReactFieldApi<TFormValues, TKey extends string> =
  TKey extends DeepKeys<TFormValues>
    ? ReactFieldStrictApi<TFormValues, TKey>
    : ReactFieldLooseApi<TFormValues>;

export interface FieldProps<TFormValues, TKey extends DeepKeys<TFormValues>> {
  name: TKey;
  children?: (props: ReactFieldStrictApi<TFormValues, TKey>) => React.ReactElement;
}

export const defaultFieldStateSelector = <T,>(state: T) => state;

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

  function useFieldState<TKey extends DeepKeys<TFormValues>, K = FieldState<TFormValues, TKey>>(
    name: TKey,
    form: FormApi<TFormValues>,
    selector: (state: FieldState<TFormValues, TKey>) => K,
  ) {
    const selectFn = selector || defaultFieldStateSelector<K>;

    const [state, setState] = useState<K>(() => selectFn(form.getFieldState(name)));

    useEffect(() => {
      const unsubscribe = form.subscribeField(name, (field) => {
        setState((prev) => {
          const next = selectFn(field);
          return next === prev ? prev : next;
        });
      });

      return () => {
        unsubscribe();
      };
    }, [form, name]);

    return state;
  }

  function Field<TKey extends DeepKeys<TFormValues>>({
    name,
    children,
  }: FieldProps<TFormValues, TKey>) {
    const form = useContext(FormContext);
    const field = useFormField({ name, form });

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
    useFieldState,
  };
}
