import { describe, expect, it } from "vitest";
import { Patcher } from "../Patcher";

describe("Patcher", () => {
  it("exposes the initial object as value and is not updated", () => {
    const obj = { a: 1, b: "x" };
    const patcher = new Patcher(obj);

    expect(patcher.value).toBe(obj);
    expect(patcher.updated).toBe(false);
  });

  it("returns false when set value is unchanged", () => {
    const patcher = new Patcher({ count: 0 });
    const before = patcher.value;

    const success = patcher.set("count", 0);

    expect(success).toBe(false);
    expect(patcher.value).toBe(before);
    expect(patcher.updated).toBe(false);
  });

  it("replaces latest with a shallow copy when a property changes", () => {
    const obj = { a: 1, b: 2 };
    const patcher = new Patcher(obj);

    const success = patcher.set("a", 10);

    expect(success).toBe(true);
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

  it("returns false when patch values are unchanged", () => {
    const patcher = new Patcher({ count: 0, label: "x" });
    const before = patcher.value;

    const success = patcher.patch({ count: 0, label: "x" });

    expect(success).toBe(false);
    expect(patcher.value).toBe(before);
    expect(patcher.updated).toBe(false);
  });

  it("returns false for an empty patch", () => {
    const patcher = new Patcher({ count: 0 });
    const before = patcher.value;

    const success = patcher.patch({});

    expect(success).toBe(false);
    expect(patcher.value).toBe(before);
    expect(patcher.updated).toBe(false);
  });

  it("replaces latest with a shallow copy when patch changes a property", () => {
    const obj = { a: 1, b: 2 };
    const patcher = new Patcher(obj);

    const success = patcher.patch({ a: 10 });

    expect(success).toBe(true);
    expect(obj).toEqual({ a: 1, b: 2 });
    expect(patcher.updated).toBe(true);
  });

  it("merges all patch fields when any property changes", () => {
    const patcher = new Patcher({ a: 1, b: 2, c: 3 });

    patcher.patch({ a: 1, b: 20, c: 30 });

    expect(patcher.value).toEqual({ a: 1, b: 20, c: 30 });
    expect(patcher.updated).toBe(true);
  });

  it("applies successive patches on the current latest object", () => {
    const patcher = new Patcher({ x: 1, y: 2 });

    patcher.patch({ x: 3 });
    patcher.patch({ y: 4 });

    expect(patcher.value).toEqual({ x: 3, y: 4 });
    expect(patcher.updated).toBe(true);
  });

  it("treats distinct object references as a change when patching", () => {
    const inner = { id: 1 };
    const patcher = new Patcher({ nested: inner });

    const replacement = { id: 1 };
    patcher.patch({ nested: replacement });

    expect(patcher.value.nested).toBe(replacement);
    expect(patcher.value.nested).not.toBe(inner);
    expect(patcher.updated).toBe(true);
  });
});
