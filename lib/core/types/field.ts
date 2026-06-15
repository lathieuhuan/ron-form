import type { FieldErrors } from "./validation";
import type { DeepKeys, DeepValue } from "./key-value";

export interface FieldMeta {
  /** user has blurred the field */
  isBlurred: boolean;
  /** user has blurred the field or changed the value */
  isTouched: boolean;
  /** user has changed the value of the field */
  isDirty: boolean;
  isValidating: boolean;
}

export interface FieldState<TFormValues, TKey extends DeepKeys<TFormValues>> {
  value: DeepValue<TFormValues, TKey>;
  meta: FieldMeta;
  errorMap: FieldErrors<TKey>;
}
