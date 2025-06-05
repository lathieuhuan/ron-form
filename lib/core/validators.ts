import { ValidatorFn } from "./types";

export const REQUIRED: ValidatorFn = (control) => {
  const value = control.getValue();

  if (value === null || value === undefined) {
    return { required: "This field is required" };
  }
  return null;
};
