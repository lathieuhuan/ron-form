import type { FieldErrors, FieldMeta } from "./types";

export const DEFAULT_ERROR_MAP: FieldErrors<string> = {
  change: [],
  blur: [],
  changeAsync: [],
  blurAsync: [],
};

export const DEFAULT_FIELD_META: FieldMeta = {
  isTouched: false,
  isDirty: false,
  isValidating: false,
};
