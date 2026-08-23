import type { DeepKeys } from "../types";
import { isPlainObject } from "./object";

export function collectFieldPaths<T = unknown>(
  obj: T,
  prefix = "",
  acc: DeepKeys<T>[] = [],
): DeepKeys<T>[] {
  if (!isPlainObject(obj)) return acc;

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    acc.push(path);
    collectFieldPaths(value, path, acc);
  }

  return acc;
}
