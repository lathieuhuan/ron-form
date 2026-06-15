import type { DeepKeys, DeepValue } from "./key-value";

export type ValidationCause = "change" | "blur";

export type ErrorCauseType = ValidationCause | `${ValidationCause}Async`;

// ===== ERRORS =====

export interface ErrorMeta {}

export interface FieldError<TKey> {
  path: TKey;
  type: ErrorCauseType;
  message: string;
  meta: ErrorMeta;
}

export type FieldErrors<TKey> = {
  [type in ErrorCauseType]?: FieldError<TKey>[];
};

// ===== VALIDATORS =====

type ErrorMessages = string | string[] | null | undefined;

type Validator<TValues, TDeepKey extends DeepKeys<TValues>> = (args: {
  value: DeepValue<TValues, TDeepKey>;
}) => ErrorMessages;

export type FormValidators<TFormValues> = {
  [K in DeepKeys<TFormValues>]?: Validator<TFormValues, K>;
};

export type AsyncValidator<TValues, TDeepKey> = (args: {
  value: DeepValue<TValues, TDeepKey>;
}) => Promise<ErrorMessages>;

export type FormAsyncValidators<TFormValues> = {
  [K in DeepKeys<TFormValues>]?: AsyncValidator<TFormValues, K>;
};

export type ValidatorMap<TFormValues> = Record<ValidationCause, FormValidators<TFormValues>>;

export type AsyncValidatorMap<TFormValues> = Record<
  ValidationCause,
  FormAsyncValidators<TFormValues>
>;
