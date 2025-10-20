import type { ComposableValidators, ValidationErrors, ValidatorFn } from "@lib/core/types";
import type { BaseControl } from "./BaseControl";

import { mergeErrors } from "@lib/core/utils/mergeErrors";
import { trueArray } from "@lib/core/utils/trueArray";

export type Validator<TValue = unknown> = {
  readonly validators: Set<ValidatorFn<TValue>>;
  add: (validators: ComposableValidators<TValue>) => void;
  set: (validators: Set<ValidatorFn<TValue>>) => void;
  remove: (validators: ComposableValidators<TValue>) => void;
  validate: () => ValidationErrors | null;
};

function composeValidator<TValue = unknown>(
  validators: Set<ValidatorFn<TValue>>,
): ValidatorFn<TValue> | null {
  if (!validators.size) return null;

  return function (control: BaseControl<TValue>) {
    return mergeErrors(Array.from(validators).map((v) => v(control)));
  };
}

export function createValidator<TValue = unknown>(control: BaseControl<TValue>): Validator<TValue> {
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
    validate: () => {
      return _validator?.(control) ?? null;
    },
  };
}
