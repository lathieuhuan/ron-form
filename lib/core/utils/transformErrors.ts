import { ErrorCauseType, FieldError } from "../types";

export function transformErrors<TField>(
  field: TField,
  type: ErrorCauseType,
  messages: string | string[] | null | undefined,
) {
  const errors = typeof messages === "string" ? [messages] : messages == null ? [] : messages;

  return errors.map<FieldError<TField>>((error) => ({
    path: field,
    type,
    message: error,
    meta: {},
  }));
}
