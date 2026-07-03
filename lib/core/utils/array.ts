export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function trueArray<T>(array: T | (T | null | undefined)[]): T[] {
  return toArray(array).filter((item) => item !== null && item !== undefined) as T[];
}
