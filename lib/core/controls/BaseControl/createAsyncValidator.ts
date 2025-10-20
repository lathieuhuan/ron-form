import type {
  AsyncValidatorFn,
  ComposableAsyncValidators,
  ValidationErrors,
} from "@lib/core/types";
import type { BaseControl } from "./BaseControl";

import { mergeErrors } from "@lib/core/utils/mergeErrors";
import { trueArray } from "@lib/core/utils/trueArray";

export type AsyncValidator<TValue = unknown> = {
  isActive: boolean;
  readonly validators: Set<AsyncValidatorFn<TValue>>;
  add: (validators: ComposableAsyncValidators<TValue>) => void;
  set: (validators: Set<AsyncValidatorFn<TValue>>) => void;
  remove: (validators: ComposableAsyncValidators<TValue>) => void;
  validate: () => Promise<ValidationErrors | null>;
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

export function createAsyncValidator<TValue = unknown>(
  control: BaseControl<TValue>,
): AsyncValidator<TValue> {
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
    validate: () => {
      return _validator?.(control) ?? Promise.resolve(null);
    },
  };
}
