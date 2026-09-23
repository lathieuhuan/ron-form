import type { DeepNames } from "../types";
import { isPlainObject } from "./object";

export function collectFieldPaths<T = unknown>(
  obj: T,
  prefix = "",
  acc: DeepNames<T>[] = [],
): DeepNames<T>[] {
  if (Array.isArray(obj)) {
    for (let index = 0; index < obj.length; index++) {
      const path = prefix ? `${prefix}.${index}` : String(index);

      acc.push(path as DeepNames<T>);
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
