import { describe, expect, it } from "vitest";
import { set } from "../set";

describe("set", () => {
  const leafValue = "updated";

  it("returns false for null or undefined root objects", () => {
    expect(set(null as unknown as Record<string, unknown>, "a", leafValue)).toBe(false);
    expect(set(undefined as unknown as Record<string, unknown>, "a", leafValue)).toBe(false);
  });

  it("sets a value on a shallow path", () => {
    const target: Record<string, unknown> = {};

    expect(set(target, "name", leafValue)).toBe(true);
    expect(target).toEqual({ name: leafValue });
  });

  it("creates nested object paths", () => {
    const target: Record<string, unknown> = {};

    expect(set(target, "user.profile.name", leafValue)).toBe(true);
    expect(target).toEqual({
      user: {
        profile: {
          name: leafValue,
        },
      },
    });
  });

  it("creates array segments for numeric path keys", () => {
    const target: Record<string, unknown> = {};

    expect(set(target, "items.0.name", leafValue)).toBe(true);
    expect(target).toEqual({
      items: [{ name: leafValue }],
    });
  });

  it("updates an existing nested value", () => {
    const target: Record<string, unknown> = {
      user: {
        profile: {
          name: "Jane",
        },
      },
    };

    expect(set(target, "user.profile.name", leafValue)).toBe(true);
    expect(target).toEqual({
      user: {
        profile: {
          name: leafValue,
        },
      },
    });
  });

  it("returns false when path crosses a non-object value", () => {
    const target: Record<string, unknown> = {
      user: "Jane",
    };

    expect(set(target, "user.profile.name", leafValue)).toBe(false);
    expect(target).toEqual({ user: "Jane" });
  });
});
