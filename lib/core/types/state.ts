import type { ValidationErrors } from "./validation";

export type ControlState = {
  isValid: boolean;
  isPending: boolean;
  isTouched: boolean;
  /** !isValid && isTouched */
  isError: boolean;
  errors: ValidationErrors | null;
};
