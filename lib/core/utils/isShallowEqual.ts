import { isObject } from "./object";

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
