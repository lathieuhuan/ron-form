import { describe, expect, it } from "vitest";
import { isObject } from "../object";

describe("isObject", () => {
  const plainObject = { key: "value" };
  const arrayValue = [1, 2, 3];

  it("returns true for objects and arrays", () => {
    expect(isObject(plainObject)).toBe(true);
    expect(isObject(arrayValue)).toBe(true);
    expect(isObject(new Date())).toBe(true);
  });

  it("returns false for null and primitives", () => {
    expect(isObject(null)).toBe(false);
    expect(isObject(undefined)).toBe(false);
    expect(isObject("object")).toBe(false);
    expect(isObject(0)).toBe(false);
    expect(isObject(false)).toBe(false);
  });
});
