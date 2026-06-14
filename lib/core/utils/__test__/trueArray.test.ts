import { describe, expect, it } from "vitest";
import { trueArray } from "../trueArray";

describe("trueArray", () => {
  const mixedArray = ["a", null, "b", undefined, "c"];
  const singleValue = "only";

  it("filters null and undefined from arrays", () => {
    expect(trueArray(mixedArray)).toEqual(["a", "b", "c"]);
  });

  it("wraps a single value and keeps it when defined", () => {
    expect(trueArray(singleValue)).toEqual(["only"]);
  });

  it("returns an empty array for null or undefined single values", () => {
    expect(trueArray(null)).toEqual([]);
    expect(trueArray(undefined)).toEqual([]);
  });
});
