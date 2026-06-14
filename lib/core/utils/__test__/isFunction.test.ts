import { describe, expect, it } from "vitest";
import { isFunction } from "../isFunction";

describe("isFunction", () => {
  const noop = () => {};

  it("returns true for functions", () => {
    expect(isFunction(noop)).toBe(true);
    expect(isFunction(Array.isArray)).toBe(true);
  });

  it("returns false for non-functions", () => {
    expect(isFunction(null)).toBe(false);
    expect(isFunction(undefined)).toBe(false);
    expect(isFunction("function")).toBe(false);
    expect(isFunction(42)).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction([])).toBe(false);
  });
});
