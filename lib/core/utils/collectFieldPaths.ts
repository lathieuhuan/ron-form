import type { DeepKeys } from "../types";
import { isPlainObject } from "./object";

export function collectFieldPaths<T = unknown>(
  obj: T,
  prefix = "",
  acc: DeepKeys<T>[] = [],
): DeepKeys<T>[] {
  if (Array.isArray(obj)) {
    for (let index = 0; index < obj.length; index++) {
      const path = prefix ? `${prefix}.${index}` : String(index);

      acc.push(path as DeepKeys<T>);
      collectFieldPaths(obj[index], path, acc);
    }

    return acc;
  }

  if (!isPlainObject(obj)) return acc;

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    acc.push(path);
    collectFieldPaths(value, path, acc);
  }

  return acc;
}
