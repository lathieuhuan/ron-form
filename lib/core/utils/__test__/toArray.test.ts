import { describe, expect, it } from "vitest";
import { toArray } from "../toArray";

describe("toArray", () => {
  const singleValue = "only";
  const arrayValue = ["first", "second"];

  it("returns the same array when given an array", () => {
    expect(toArray(arrayValue)).toBe(arrayValue);
    expect(toArray(arrayValue)).toEqual(["first", "second"]);
  });

  it("wraps a non-array value in an array", () => {
    expect(toArray(singleValue)).toEqual(["only"]);
    expect(toArray(42)).toEqual([42]);
    expect(toArray(null)).toEqual([null]);
  });
});
