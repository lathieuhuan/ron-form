import type {
  DeepKeys,
  DeepValue,
  FieldError,
  FieldMeta,
  FieldState,
  FormApi,
  HandleChangeOptions,
} from "@lib/core";

export interface ReactFieldLooseApi<TFormValues> {
  id: string;
  name: string;
  value: any;
  meta: FieldMeta<TFormValues>;
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
  errors: FieldError<string>[];
  form: FormApi<TFormValues>;
  handleChange(value: DeepValue<TFormValues, TKey>, options?: HandleChangeOptions): void;
  handleBlur(): void;
}

export type ReactFieldApi<TFormValues, TKey extends string> =
  TKey extends DeepKeys<TFormValues>
    ? ReactFieldStrictApi<TFormValues, TKey>
    : ReactFieldLooseApi<TFormValues>;
