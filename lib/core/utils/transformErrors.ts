import type { ErrorCauseType, FieldError, ValidationResult } from "../types";
import { parseRawError } from "./parseRawError";

export function transformErrors<TField>(
  field: TField,
  type: ErrorCauseType,
  rawError: ValidationResult,
): FieldError<TField>[] {
  if (rawError == null) {
    return [];
  }

  const errors = Array.isArray(rawError) ? rawError : [rawError];

  return errors.map<FieldError<TField>>((error) => {
    const { message, meta } = parseRawError(error);

    return {
      path: field,
      type,
      message,
      meta,
    };
  });
}
