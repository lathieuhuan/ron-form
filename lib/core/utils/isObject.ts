import { AnyObject } from "../types/utils";

export function isObject(value: unknown): value is AnyObject {
  return typeof value === "object" && value !== null;
}
