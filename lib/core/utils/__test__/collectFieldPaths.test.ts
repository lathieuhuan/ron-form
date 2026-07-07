import { describe, expect, it } from "vitest";
import { collectFieldPaths } from "../object";

describe("collectFieldPaths", () => {
  it("returns null for non-plain objects", () => {
    expect(collectFieldPaths(null)).toBeNull();
    expect(collectFieldPaths(undefined)).toBeNull();
    expect(collectFieldPaths("text")).toBeNull();
    expect(collectFieldPaths(42)).toBeNull();
    expect(collectFieldPaths([])).toBeNull();
    expect(collectFieldPaths(new Date())).toBeNull();
  });

  it("returns an empty array for an empty plain object", () => {
    expect(collectFieldPaths({})).toEqual([]);
    expect(collectFieldPaths(Object.create(null))).toEqual([]);
  });

  it("collects top-level paths for a flat object", () => {
    expect(collectFieldPaths({ name: "Jane", age: 30 })).toEqual(["name", "age"]);
  });

  it("collects nested paths including intermediate keys", () => {
    const obj = {
      user: {
        profile: {
          name: "Jane",
        },
      },
      count: 0,
    };

    expect(collectFieldPaths(obj)).toEqual(["user", "user.profile", "user.profile.name", "count"]);
  });

  it("prefixes paths when a prefix is provided", () => {
    const obj = {
      street: "Main St",
      city: "Springfield",
    };

    expect(collectFieldPaths(obj, "address")).toEqual(["address.street", "address.city"]);
  });

  it("does not include the prefix itself in the result", () => {
    expect(collectFieldPaths({ nested: { value: 1 } }, "parent")).toEqual([
      "parent.nested",
      "parent.nested.value",
    ]);
  });
});
