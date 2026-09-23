import type { AnyObject, DeepNames, WildcardDeepNames } from "../types";
import { isObject } from "./object";

function walk<T>(
  segments: string[],
  segmentIndex: number,
  current: unknown,
  prefix: string,
): DeepNames<T>[] {
  if (segmentIndex >= segments.length) {
    return prefix ? [prefix as DeepNames<T>] : [];
  }

  const segment = segments[segmentIndex];

  if (segment === "[n]") {
    if (!Array.isArray(current)) {
      return [];
    }

    const results: DeepNames<T>[] = [];
    for (let i = 0; i < current.length; i++) {
      const nextPrefix = prefix ? `${prefix}.${i}` : `${i}`;
      results.push(...walk(segments, segmentIndex + 1, current[i], nextPrefix));
    }
    return results;
  }

  if (!isObject(current)) {
    return [];
  }

  const nextPrefix = prefix ? `${prefix}.${segment}` : segment;

  return walk(segments, segmentIndex + 1, current[segment], nextPrefix);
}

export function parseWildcardDeepNames<T>(
  field: WildcardDeepNames<T>,
  values: AnyObject,
): DeepNames<T>[] {
  return walk(field.split("."), 0, values, "");
}
