import type { FormControl } from "../FormControl";
import type { DeepKeys, DeepValue } from "./key-value";
import type { FieldMeta, FieldState, FormMeta } from "./state";
import type { Updater } from "./utils";
import type { FieldError, FieldErrors, ValidationCause } from "./validation";

export type FormMetaApi = {
  get(): FormMeta;
  set(changes: Partial<FormMeta> | ((meta: FormMeta) => Partial<FormMeta>)): void;
  subscribe(subscriber: (meta: FormMeta) => void): () => void;
};

export type ChangeCause = "user" | "programmatic";

export type ValueChangeData<TFormValues, TKey extends DeepKeys<TFormValues>> = {
  value: DeepValue<TFormValues, TKey>;
  oldValue: DeepValue<TFormValues, TKey>;
  cause: ChangeCause;
  form: FormControl<TFormValues>;
};

export type SetFieldValueOptions = {
  dontTouch?: boolean;
  dontDirty?: boolean;
  dontValidate?: boolean;
  cause?: ChangeCause;
};

export type ValidateSyncOptions = {
  shouldBlur: boolean;
  shouldTouch: boolean;
  shouldDirty: boolean;
};

export interface FormApi<TFormValues> {
  values: TFormValues;
  meta: FormMetaApi;

  getFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
  ): DeepValue<TFormValues, TField>;

  getFieldMeta<TField extends DeepKeys<TFormValues>>(field: TField): FieldMeta;

  getFieldErrorMap<TField extends DeepKeys<TFormValues>>(field: TField): FieldErrors<TField>;

  getFieldState<TField extends DeepKeys<TFormValues>>(
    field: TField,
  ): FieldState<TFormValues, TField>;

  subscribeField<TField extends DeepKeys<TFormValues>>(
    key: TField,
    subscriber: (field: FieldState<TFormValues, TField>) => void,
  ): () => void;

  subscribeFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
    subscriber: (props: ValueChangeData<TFormValues, TField>) => void,
  ): () => void;

  setFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
    value: DeepValue<TFormValues, TField>,
    options?: SetFieldValueOptions,
  ): boolean;

  setFieldMeta<TField extends DeepKeys<TFormValues>>(
    field: TField,
    updater: Updater<FieldMeta>,
  ): void;

  validateSync<TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    options: Partial<ValidateSyncOptions>,
  ): FieldError<TField>[];

  validateAsync<TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
  ): Promise<FieldError<TField>[]>;

  handleSubmit(): void;

  reset(): void;
}
