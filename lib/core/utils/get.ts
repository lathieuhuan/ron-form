import type { AnyObject } from "../types/utils";
import { isObject } from "./object";

export function get<T extends AnyObject>(obj: T, path: string, defaultValue: any = undefined) {
  const segments = path.split(".");
  let current: any = obj;

  for (let i = 0; i < segments.length; i++) {
    if (!isObject(current)) {
      return defaultValue;
    }

    current = current[segments[i]];
  }

  return current;
}
