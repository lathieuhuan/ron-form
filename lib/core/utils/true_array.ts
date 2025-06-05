import { toArray } from "./to_array";

export function trueArray<T>(array: T | (T | null | undefined)[]): T[] {
  return toArray(array).filter(Boolean) as T[];
}
