import { describe, expect, it } from "vitest";
import { Patcher } from "../Patcher";

describe("Patcher", () => {
  it("exposes the initial object as value and is not updated", () => {
    const obj = { a: 1, b: "x" };
    const patcher = new Patcher(obj);

    expect(patcher.value).toBe(obj);
    expect(patcher.updated).toBe(false);
  });

  it("returns the same latest reference when set value is unchanged", () => {
    const patcher = new Patcher({ count: 0 });
    const before = patcher.value;

    const result = patcher.set("count", 0);

    expect(result).toBe(before);
    expect(patcher.value).toBe(before);
    expect(patcher.updated).toBe(false);
  });

  it("replaces latest with a shallow copy when a property changes", () => {
    const obj = { a: 1, b: 2 };
    const patcher = new Patcher(obj);

    const next = patcher.set("a", 10);

    expect(next).toBe(patcher.value);
    expect(next).not.toBe(obj);
    expect(next).toEqual({ a: 10, b: 2 });
    expect(obj).toEqual({ a: 1, b: 2 });
    expect(patcher.updated).toBe(true);
  });

  it("applies successive sets on the current latest object", () => {
    const patcher = new Patcher({ x: 1, y: 2 });

    patcher.set("x", 3);
    patcher.set("y", 4);

    expect(patcher.value).toEqual({ x: 3, y: 4 });
    expect(patcher.updated).toBe(true);
  });

  it("treats distinct object references as a change", () => {
    const inner = { id: 1 };
    const patcher = new Patcher({ nested: inner });

    const replacement = { id: 1 };
    patcher.set("nested", replacement);

    expect(patcher.value.nested).toBe(replacement);
    expect(patcher.value.nested).not.toBe(inner);
    expect(patcher.updated).toBe(true);
  });
});
