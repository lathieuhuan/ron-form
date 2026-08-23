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

type UpdateReturn<T extends object> = {
  success: boolean;
  result: T;
};

export function update<T extends object>(obj: T, key: keyof T, value: T[keyof T]): UpdateReturn<T>;
export function update<T extends object>(obj: T, data: Partial<T>): UpdateReturn<T>;
export function update<T extends object>(
  obj: T,
  keyOrData: keyof T | Partial<T>,
  value?: T[keyof T],
): UpdateReturn<T> {
  let success = false;

  if (isObject(keyOrData)) {
    for (const key in keyOrData) {
      if (keyOrData[key] !== obj[key]) {
        obj = {
          ...obj,
          ...keyOrData,
        };

        success = true;
        break;
      }
    }

    return { success, result: obj };
  }

  if (value !== obj[keyOrData]) {
    obj = {
      ...obj,
      [keyOrData]: value,
    };

    success = true;
  }

  return { success, result: obj };
}

export function keys<T extends object>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}

export function entries<T extends object>(obj: T) {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}
