import { describe, expect, it } from "vitest";
import { update } from "../object";

describe("update", () => {
  describe("single key", () => {
    it("returns success false, result unchanged when value is unchanged", () => {
      const obj = { count: 0 };

      const { success, result } = update(obj, "count", 0);

      expect(success).toBe(false);
      expect(result).toBe(obj);
      expect(obj).toEqual({ count: 0 });
    });

    it("updates the property and return new result when value changes", () => {
      const obj = { a: 1, b: 2 };

      const { success, result } = update(obj, "a", 10);

      expect(success).toBe(true);
      expect(result).toEqual({ a: 10, b: 2 });
      expect(obj).toEqual({ a: 1, b: 2 });
    });

    it("treats distinct object references as a change", () => {
      const inner = { id: 1 };
      const obj = { nested: inner };

      const replacement = { id: 1 };
      const { success, result } = update(obj, "nested", replacement);

      expect(success).toBe(true);
      expect(result.nested).toBe(replacement);
      expect(obj).toEqual({ nested: inner });
    });
  });

  describe("partial data", () => {
    it("returns success false, result unchanged when all patch values are unchanged", () => {
      const obj = { count: 0, label: "x" };

      const { success, result } = update(obj, { count: 0, label: "x" });

      expect(success).toBe(false);
      expect(result).toBe(obj);
      expect(obj).toEqual({ count: 0, label: "x" });
    });

    it("returns success false, result unchanged for an empty patch", () => {
      const obj = { count: 0 };

      const { success, result } = update(obj, {});

      expect(success).toBe(false);
      expect(result).toBe(obj);
      expect(obj).toEqual({ count: 0 });
    });

    it("merges all patch fields and return new result when any property changes", () => {
      const obj = { a: 1, b: 2, c: 3 };

      const { success, result } = update(obj, { a: 1, b: 20, c: 30 });

      expect(success).toBe(true);
      expect(result).toEqual({ a: 1, b: 20, c: 30 });
      expect(obj).toEqual({ a: 1, b: 2, c: 3 });
    });

    it("treats distinct object references as a change and return new result when patching", () => {
      const inner = { id: 1 };
      const obj = { nested: inner };

      const replacement = { id: 1 };
      const { success, result } = update(obj, { nested: replacement });

      expect(success).toBe(true);
      expect(result.nested).toBe(replacement);
      expect(obj).toEqual({ nested: inner });
    });
  });
});
