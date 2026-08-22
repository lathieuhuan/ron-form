import type { DeepKeys, WildcardDeepKeys } from "../types";

export const toWildCardDeepKey = <TFormValues>(
  field: DeepKeys<TFormValues>,
): WildcardDeepKeys<TFormValues> => {
  return field
    .split(".")
    .map((segment) => (/^\d+$/.test(segment) ? "[n]" : segment))
    .join(".");
};
