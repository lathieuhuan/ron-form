import { ValidatorFn } from "@lib/core/types";
import { AsyncValidatorFn } from "@lib/core/types";

export const REQUIRED_ERROR = { required: "required" };
export const ASYNC_ERROR = { asyncError: "asyncError" };

export const requiredValidator: ValidatorFn<string | null> = (control) => {
  return control.getValue() ? null : REQUIRED_ERROR;
};

export const asyncValidator: AsyncValidatorFn<string | null> = async (control) => {
  const value = control.getValue();

  return new Promise((resolve) => {
    setTimeout(() => resolve(value ? null : ASYNC_ERROR), 100);
  });
};
