import { ValidationErrors } from "../types";

export function mergeErrors(arrayOfErrors: (ValidationErrors | null)[]): ValidationErrors | null {
  const result = arrayOfErrors.reduce<ValidationErrors>((acc, errors) => {
    if (errors) {
      return Object.assign(acc, errors);
    }
    return acc;
  }, {});

  return Object.keys(result).length === 0 ? null : result;
}
