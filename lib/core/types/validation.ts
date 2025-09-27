import type { BaseControl } from "../controls/BaseControl";

export type ValidationErrors = {
  [key: string]: string;
};

export type ValidatorFn<TValue = unknown> = (
  control: BaseControl<TValue>,
) => ValidationErrors | null;

export type AsyncValidatorFn<TValue = unknown> = (
  control: BaseControl<TValue>,
) => Promise<ValidationErrors | null>;

export type ComposableValidators<TValue = unknown> =
  | ValidatorFn<TValue>
  | (ValidatorFn<TValue> | null | undefined)[];

export type ComposableAsyncValidators<TValue = unknown> =
  | AsyncValidatorFn<TValue>
  | (AsyncValidatorFn<TValue> | null | undefined)[];
