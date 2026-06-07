import type { AnyObject } from "../types/utils";
import { isObject } from "./isObject";

const indexRegex = /^\d+$/;

export function set<T extends AnyObject>(obj: T, path: string, value: any) {
  const segments = path.split(".");
  let current: any = obj;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (current == null) {
      current = indexRegex.test(segment) ? [] : {};
    }

    if (i === segments.length - 1) {
      if (!isObject(current)) {
        return false;
      }

      current[segment] = value;
    } else {
      current = current[segment];
    }
  }

  return true;
}
