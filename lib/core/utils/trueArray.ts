import { toArray } from "./toArray";

export function trueArray<T>(array: T | (T | null | undefined)[]): T[] {
  return toArray(array).filter((item) => item !== null && item !== undefined) as T[];
}
