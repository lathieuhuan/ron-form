import type { BaseControl } from "../controls/BaseControl";

export type ValidateOptions = {
  // /** Whether to touch the control after validate. Only work on ItemControl. Default true */
  // shouldTouch?: boolean;
  // /** muted validation will not notify subscribers. Default false */
  // isMuted?: boolean;
  // /** bubbling validation will validate the parent controls. Default false */
  // isBubbling?: boolean;
  onError?: (errors: ValidationErrors) => void;
};

// export type ValidateAllOptions = Pick<ValidateOptions, "isMuted">;
export type ValidateAllOptions = never;

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
