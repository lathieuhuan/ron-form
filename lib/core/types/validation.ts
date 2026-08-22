import type { FormApi } from "./form-api";
import type { WildcardDeepKeys, DeepValue } from "./key-value";

export type ValidationCause = "change" | "blur";

export type ErrorCauseType = ValidationCause | `${ValidationCause}Async`;

// ===== ERRORS =====

export type RawError = string | { message: string };

export interface ErrorMeta {}

export interface FieldError<TKey> {
  path: TKey;
  type: ErrorCauseType;
  message: string;
  meta: ErrorMeta;
}

export type FieldErrors<TKey> = {
  [type in ErrorCauseType]: FieldError<TKey>[];
};

// ===== VALIDATORS =====

export type ValidationResult = RawError | RawError[] | null | undefined;

type Validator<TValues, TDeepKey extends WildcardDeepKeys<TValues>> = (args: {
  value: DeepValue<TValues, TDeepKey>;
  form: FormApi<TValues>;
}) => ValidationResult;

export type ValidatorKey<TFormValues> = WildcardDeepKeys<TFormValues>

export type FormValidators<TFormValues> = {
  [AK in ValidatorKey<TFormValues>]?: Validator<TFormValues, AK>;
};

export type AsyncValidator<TValues, TDeepKey> = (args: {
  value: DeepValue<TValues, TDeepKey>;
  form: FormApi<TValues>;
}) => Promise<ValidationResult>;

export type FormAsyncValidators<TFormValues> = {
  [K in ValidatorKey<TFormValues>]?: AsyncValidator<TFormValues, K>;
};

export type ValidatorMap<TFormValues> = Record<ValidationCause, FormValidators<TFormValues>>;

export type AsyncValidatorMap<TFormValues> = Record<
  ValidationCause,
  FormAsyncValidators<TFormValues>
>;
