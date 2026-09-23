import type { FormControl } from "../FormControl";
import type { DeepNames, DeepValue } from "./name-value";
import type { FieldMeta, FieldState, FormMeta } from "./state";
import type { Updater } from "./utils";
import type { FieldError, FieldErrors, ValidationCause } from "./validation";

export type FormMetaApi = {
  get(): FormMeta;
  set(changes: Partial<FormMeta> | ((meta: FormMeta) => Partial<FormMeta>)): void;
  subscribe(subscriber: (meta: FormMeta) => void): () => void;
};

export type ChangeCause = "user" | "programmatic";

export type ValueChangeData<TFormValues, TKey extends DeepNames<TFormValues>> = {
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

  getFieldValue<TField extends DeepNames<TFormValues>>(
    field: TField,
  ): DeepValue<TFormValues, TField>;

  getFieldMeta<TField extends DeepNames<TFormValues>>(field: TField): FieldMeta<TFormValues>;

  getFieldErrorMap<TField extends DeepNames<TFormValues>>(field: TField): FieldErrors<TField>;

  getFieldState<TField extends DeepNames<TFormValues>>(
    field: TField,
  ): FieldState<TFormValues, TField>;

  subscribeField<TField extends DeepNames<TFormValues>>(
    key: TField,
    subscriber: (field: FieldState<TFormValues, TField>) => void,
  ): () => void;

  subscribeFieldValue<TField extends DeepNames<TFormValues>>(
    field: TField,
    subscriber: (props: ValueChangeData<TFormValues, TField>) => void,
  ): () => void;

  setFieldValue<TField extends DeepNames<TFormValues>>(
    field: TField,
    value: DeepValue<TFormValues, TField>,
    options?: SetFieldValueOptions,
  ): boolean;

  setFieldMeta<TField extends DeepNames<TFormValues>>(
    field: TField,
    updater: Updater<FieldMeta<TFormValues>>,
  ): void;

  validateSync<TField extends DeepNames<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    options?: Partial<ValidateSyncOptions>,
  ): FieldError<TField>[];

  validateAsync<TField extends DeepNames<TFormValues>>(
    field: TField,
    cause: ValidationCause,
  ): Promise<FieldError<TField>[]>;

  handleSubmit(): void;

  reset(): void;
}
