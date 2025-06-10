import type { BaseControl } from "./base_control";
import type { ComposableValidators, ValidatorFn } from "../types";
import { mergeErrors } from "../utils/merge_errors";
import { trueArray } from "../utils/true_array";

type Validator<TValue = unknown> = {
  readonly validators: Set<ValidatorFn<TValue>>;
  add: (validators: ComposableValidators<TValue>) => void;
  set: (validators: Set<ValidatorFn<TValue>>) => void;
  remove: (validators: ComposableValidators<TValue>) => void;
  validate: ValidatorFn<TValue>;
};

function composeValidator<TValue = unknown>(
  validators: Set<ValidatorFn<TValue>>,
): ValidatorFn<TValue> | null {
  if (!validators.size) return null;

  return function (control: BaseControl<TValue>) {
    return mergeErrors(Array.from(validators).map((v) => v(control)));
  };
}

export function createValidator<TValue = unknown>(): Validator<TValue> {
  let _validators: Set<ValidatorFn<TValue>> = new Set();
  let _validator: ValidatorFn<TValue> | null = null;

  return {
    get validators() {
      return _validators;
    },
    add(validators) {
      trueArray(validators).forEach((v) => _validators.add(v));
      _validator = composeValidator(_validators);
    },
    set(validators) {
      _validators = validators;
      _validator = composeValidator(_validators);
    },
    remove(validators) {
      trueArray(validators).forEach((v) => _validators.delete(v));
      _validator = composeValidator(_validators);
    },
    validate: (value) => {
      return _validator?.(value) ?? null;
    },
  };
}
