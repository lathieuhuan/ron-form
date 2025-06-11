import type { AsyncValidatorFn, ValidatorFn } from "@lib/core/types";

export const REQUIRED_ERROR = { required: "required" };
export const ASYNC_ERROR = { asyncError: "asyncError" };

export const requiredValidator: ValidatorFn<any> = (control) => {
  return control.getValue() ? null : REQUIRED_ERROR;
};

export const requiredAsyncValidator: AsyncValidatorFn<any> = async (control) => {
  const value = control.getValue();

  return new Promise((resolve) => {
    setTimeout(() => resolve(value ? null : ASYNC_ERROR), 200);
  });
};

export const makeRequiredAsyncValidator: (delay: number) => AsyncValidatorFn<any> = (delay) => {
  return async (control) => {
    const value = control.getValue();

    return new Promise((resolve) => {
      setTimeout(() => resolve(value ? null : ASYNC_ERROR), delay);
    });
  };
};
