import type { AnyObject } from "../types";

export function isObject(value: unknown): value is AnyObject {
  return typeof value === "object" && value !== null;
}

export function isPlainObject(value: unknown): value is AnyObject {
  if (!isObject(value)) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function isShallowEqual(a: object, b: object) {
  if (!isObject(a) || !isObject(b)) {
    return false;
  }

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  return aKeys.every((key) => a[key] === b[key]);
}

export function get<T extends AnyObject>(obj: T, path: string, defaultValue: any = undefined) {
  const segments = path.split(".");
  let current: unknown = obj;

  for (let i = 0; i < segments.length; i++) {
    if (!isObject(current)) {
      return defaultValue;
    }

    current = current[segments[i]];
  }

  return current;
}

const indexRegex = /^\d+$/;

export function set(obj: Record<string, unknown>, path: string, value: unknown) {
  if (obj == null) {
    return false;
  }

  try {
    const keys = path.split(".");
    let parent: Record<string, unknown> = obj;
    let current: unknown = obj;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (current == null) {
        const prevKey = keys[i - 1];

        parent[prevKey] = indexRegex.test(key) ? [] : {};
        current = parent[prevKey];
      }

      if (!isObject(current)) {
        return false;
      }

      if (i === keys.length - 1) {
        current[key] = value;
      } else {
        parent = current;
        current = current[key];
      }
    }

    return true;
  } catch (e) {
    console.info("Error occurred while setting value to", path);
    console.error(e);
    return false;
  }
}

export function keys<T extends object>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}

export function entries<T extends object>(obj: T) {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}
