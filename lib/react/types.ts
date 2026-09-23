import type {
  DeepNames,
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
  TKey extends DeepNames<TFormValues> = DeepNames<TFormValues>,
> extends FieldState<TFormValues, TKey> {
  id: string;
  name: TKey;
  errors: FieldError<string>[];
  form: FormApi<TFormValues>;
  handleChange(value: DeepValue<TFormValues, TKey>, options?: HandleChangeOptions): void;
  handleBlur(): void;
}

export type ReactFieldApi<TFormValues, TKey extends string> =
  TKey extends DeepNames<TFormValues>
    ? ReactFieldStrictApi<TFormValues, TKey>
    : ReactFieldLooseApi<TFormValues>;
