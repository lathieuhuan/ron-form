import { describe, expect, it } from "vitest";
import { isShallowEqual } from "../object";

describe("isShallowEqual", () => {
  it("returns true for objects with the same keys and values", () => {
    const a = { name: "Jane", age: 30 };
    const b = { name: "Jane", age: 30 };

    expect(isShallowEqual(a, b)).toBe(true);
  });

  it("returns true for empty objects", () => {
    expect(isShallowEqual({}, {})).toBe(true);
  });

  it("returns true when comparing the same object reference", () => {
    const value = { id: 1, active: true };

    expect(isShallowEqual(value, value)).toBe(true);
  });

  it("returns false when values differ", () => {
    const a = { name: "Jane" };
    const b = { name: "John" };

    expect(isShallowEqual(a, b)).toBe(false);
  });

  it("returns false when key counts differ", () => {
    const a = { name: "Jane" };
    const b = { name: "Jane", age: 30 };

    expect(isShallowEqual(a, b)).toBe(false);
  });

  it("returns false when keys differ but counts match", () => {
    const a = { name: "Jane" };
    const b = { title: "Jane" };

    expect(isShallowEqual(a, b)).toBe(false);
  });

  it("returns false when either argument is not an object", () => {
    expect(isShallowEqual(null as unknown as Record<string, unknown>, {})).toBe(false);
    expect(isShallowEqual({}, null as unknown as Record<string, unknown>)).toBe(false);
    expect(isShallowEqual(undefined as unknown as Record<string, unknown>, {})).toBe(false);
    expect(isShallowEqual("value" as unknown as Record<string, unknown>, {})).toBe(false);
    expect(isShallowEqual({}, 0 as unknown as Record<string, unknown>)).toBe(false);
  });

  it("compares nested values by reference, not deep equality", () => {
    const nested = { count: 1 };
    const a = { nested };
    const b = { nested: { count: 1 } };

    expect(isShallowEqual(a, b)).toBe(false);
    expect(isShallowEqual(a, { nested })).toBe(true);
  });

  it("compares array values by reference", () => {
    const tags = ["a", "b"];
    const a = { tags };
    const b = { tags: ["a", "b"] };

    expect(isShallowEqual(a, b)).toBe(false);
    expect(isShallowEqual(a, { tags })).toBe(true);
  });
});
