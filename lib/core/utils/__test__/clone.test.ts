import { describe, expect, it } from "vitest";
import { clone } from "../clone";

describe("clone", () => {
  const sourceObject = {
    name: "Jane",
    nested: {
      count: 2,
      tags: ["a", "b"],
    },
  };

  it("returns a deep copy that is not the same reference", () => {
    const cloned = clone(sourceObject);

    expect(cloned).toEqual(sourceObject);
    expect(cloned).not.toBe(sourceObject);
    expect(cloned.nested).not.toBe(sourceObject.nested);
    expect(cloned.nested.tags).not.toBe(sourceObject.nested.tags);
  });

  it("does not mutate the original when the clone is changed", () => {
    const cloned = clone(sourceObject);

    cloned.nested.count = 99;
    cloned.nested.tags.push("c");

    expect(sourceObject.nested.count).toBe(2);
    expect(sourceObject.nested.tags).toEqual(["a", "b"]);
  });

  it("falls back to json cloning for non-cloneable values", () => {
    const sourceWithFunction = {
      id: 1,
      handler: () => "run",
    };

    const cloned = clone(sourceWithFunction);

    expect(cloned).toEqual({ id: 1 });
    expect(cloned).not.toBe(sourceWithFunction);
  });
});
