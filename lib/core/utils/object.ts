import { AnyObject, DeepKeys } from "../types";

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

export function keys<T extends object>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}

export function entries<T extends object>(obj: T) {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

export function extractFields<T = unknown>(
  obj: T,
  prefix = "",
  acc: DeepKeys<T>[] = [],
): DeepKeys<T>[] | null {
  if (!isPlainObject(obj)) return null;

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    acc.push(path);
    extractFields(value, path, acc);
  }

  return acc;
}
