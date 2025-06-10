import type { BaseControl } from "./base_control";
import type { AsyncValidatorFn, ComposableAsyncValidators } from "../types";
import { mergeErrors } from "../utils/merge_errors";
import { trueArray } from "../utils/true_array";

type AsyncValidator<TValue = unknown> = {
  isActive: boolean;
  readonly validators: Set<AsyncValidatorFn<TValue>>;
  add: (validators: ComposableAsyncValidators<TValue>) => void;
  set: (validators: Set<AsyncValidatorFn<TValue>>) => void;
  remove: (validators: ComposableAsyncValidators<TValue>) => void;
  validate: AsyncValidatorFn<TValue>;
};

function composeAsyncValidator<TValue = unknown>(
  validators: Set<AsyncValidatorFn<TValue>>,
): AsyncValidatorFn<TValue> | null {
  if (!validators.size) return null;

  return async function (control: BaseControl<TValue>) {
    const errors = await Promise.all(Array.from(validators).map((v) => v(control)));
    return mergeErrors(errors);
  };
}

export function createAsyncValidator<TValue = unknown>(): AsyncValidator<TValue> {
  let _validators: Set<AsyncValidatorFn<TValue>> = new Set();
  let _validator: AsyncValidatorFn<TValue> | null = null;

  return {
    get isActive() {
      return _validator !== null;
    },
    get validators() {
      return _validators;
    },
    add(validators) {
      trueArray(validators).forEach((v) => _validators.add(v));
      _validator = composeAsyncValidator(_validators);
    },
    set(validators) {
      _validators = validators;
      _validator = composeAsyncValidator(_validators);
    },
    remove(validators) {
      trueArray(validators).forEach((v) => _validators.delete(v));
      _validator = composeAsyncValidator(_validators);
    },
    validate: (value) => {
      return _validator?.(value) ?? Promise.resolve(null);
    },
  };
}
