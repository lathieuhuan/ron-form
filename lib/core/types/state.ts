import type { FieldErrors } from "./validation";
import type { DeepNames, DeepValue } from "./name-value";

interface BaseMeta {
  /** user has blurred the field */
  isBlurred: boolean;
  /** user has blurred the field or changed the value */
  isTouched: boolean;
  /** user has changed the value of the field */
  isDirty: boolean;
  isValidating: boolean;
}

export interface FieldMeta<TFormValues> extends BaseMeta {
  errors: FieldErrors<DeepNames<TFormValues>>;
}

export interface FieldState<TFormValues, TKey extends DeepNames<TFormValues>> {
  value: DeepValue<TFormValues, TKey>;
  meta: FieldMeta<TFormValues>;
}

export interface FormMeta extends BaseMeta {
  submitCount: number;
}
