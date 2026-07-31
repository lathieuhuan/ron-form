import type { ChangeCause, ErrorCauseType, FieldErrors, FieldMeta, FormMeta } from "./types";

export const DEFAULT_CHANGE_CAUSE = "programmatic" as const satisfies ChangeCause;

const ERROR_CAUSE_MAP: Record<ErrorCauseType, true> = {
  change: true,
  blur: true,
  changeAsync: true,
  blurAsync: true,
};

export const ERROR_CAUSES = Object.keys(ERROR_CAUSE_MAP) as ErrorCauseType[];

export const DEFAULT_ERROR_MAP: FieldErrors<any> = {
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
