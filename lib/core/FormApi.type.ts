import type { FormMetaApi } from "./FormMetaControl";
import type {
  DeepKeys,
  DeepValue,
  FieldError,
  FieldErrors,
  FieldMeta,
  FieldState,
  Updater,
  ValidationCause,
} from "./types";

export type SetFieldValueOptions = {
  dontTouch?: boolean;
  dontDirty?: boolean;
  dontValidate?: boolean;
};

export type ValidateSyncOptions = {
  shouldBlur?: boolean;
  shouldTouch?: boolean;
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
    options: ValidateSyncOptions,
  ): FieldError<TField>[];

  validateAsync<TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
  ): Promise<FieldError<TField>[]>;

  handleSubmit(): void;

  reset(): void;
}
