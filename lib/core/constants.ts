import type { ChangeCause, FieldErrors, FieldMeta, FormMeta } from "./types";

export const DEFAULT_CHANGE_CAUSE = "programmatic" as const satisfies ChangeCause;

export const DEFAULT_ERROR_MAP: FieldErrors<string> = {
  change: [],
  blur: [],
  changeAsync: [],
  blurAsync: [],
};

export const DEFAULT_META: FieldMeta = {
  isBlurred: false,
  isTouched: false,
  isDirty: false,
  isValidating: false,
};

export const DEFAULT_FORM_META: FormMeta = {
  isBlurred: false,
  isTouched: false,
  isDirty: false,
  isValidating: false,
  submitCount: 0,
};
