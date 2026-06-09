import type { FieldErrors } from "./validation";
import type { DeepKeys, DeepValue } from "./key-value";

export interface FieldMeta {
  /** user has focused and blurred the field */
  isTouched: boolean;
  /** user has changed the value of the field */
  isDirty: boolean;
  isValidating: boolean;
}

export interface FieldApi<TFormValues, TKey extends DeepKeys<TFormValues>> {
  value: DeepValue<TFormValues, TKey>;
  meta: FieldMeta;
  errorMap: FieldErrors<TKey>;
}
