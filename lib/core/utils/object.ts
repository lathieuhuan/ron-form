import { AnyObject } from "../types/utils";

export function isObject(value: unknown): value is AnyObject {
  return typeof value === "object" && value !== null;
}

export function keys<T extends object>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}

export function entries<T extends object>(obj: T) {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}
