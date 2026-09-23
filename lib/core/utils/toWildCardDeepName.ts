import type { DeepNames, WildcardDeepNames } from "../types";

export const toWildCardDeepName = <TFormValues>(
  field: DeepNames<TFormValues>,
): WildcardDeepNames<TFormValues> => {
  return field
    .split(".")
    .map((segment) => (/^\d+$/.test(segment) ? "[n]" : segment))
    .join(".");
};
