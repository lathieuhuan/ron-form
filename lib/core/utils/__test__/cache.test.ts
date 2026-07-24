import { describe, expect, it, vi } from "vitest";
import { cache } from "../cache";

describe("cache", () => {
  it("returns the value from the getter on first access", () => {
    const getter = vi.fn((key: string) => `value-${key}`);
    const cached = cache(getter);

    expect(cached.get("a")).toBe("value-a");
    expect(getter).toHaveBeenCalledOnce();
    expect(getter).toHaveBeenCalledWith("a");
  });

  it("returns the cached value without calling the getter again", () => {
    const getter = vi.fn((key: string) => `value-${key}`);
    const cached = cache(getter);

    expect(cached.get("a")).toBe("value-a");
    expect(cached.get("a")).toBe("value-a");

    expect(getter).toHaveBeenCalledOnce();
  });

  it("calls the getter separately for different keys", () => {
    const getter = vi.fn((key: string) => `value-${key}`);
    const cached = cache(getter);

    expect(cached.get("a")).toBe("value-a");
    expect(cached.get("b")).toBe("value-b");

    expect(getter).toHaveBeenCalledTimes(2);
    expect(getter).toHaveBeenNthCalledWith(1, "a");
    expect(getter).toHaveBeenNthCalledWith(2, "b");
  });

  it("caches falsy values", () => {
    const getter = vi.fn(() => 0);
    const cached = cache(getter);

    expect(cached.get("key")).toBe(0);
    expect(cached.get("key")).toBe(0);

    expect(getter).toHaveBeenCalledOnce();
  });

  it("uses reference equality for object keys", () => {
    const keyA = { id: 1 };
    const keyB = { id: 1 };
    const getter = vi.fn((key: { id: number }) => key.id);
    const cached = cache(getter);

    expect(cached.get(keyA)).toBe(1);
    expect(cached.get(keyA)).toBe(1);
    expect(cached.get(keyB)).toBe(1);

    expect(getter).toHaveBeenCalledTimes(2);
  });
});
