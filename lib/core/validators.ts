import { ValidatorFn } from "./types";

export function makeRequiredValidator<TValue = unknown>(): ValidatorFn<TValue | undefined> {
  return (control) => {
    const value = control.getValue();
    if (value === null || value === undefined || value === "") {
      return { required: "This field is required" };
    }
    return null;
  };
}

export const REQUIRED: ValidatorFn<any> = (control) => {
  const value = control.getValue();

  if (value === null || value === undefined || value === "") {
    return { required: "This field is required" };
  }
  return null;
};
