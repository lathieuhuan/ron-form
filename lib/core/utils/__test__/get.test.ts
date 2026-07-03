import { describe, expect, it } from "vitest";
import { get } from "../object";

describe("get", () => {
  const nestedObject = {
    user: {
      profile: {
        name: "Jane",
      },
    },
    count: 0,
  };
  const defaultValue = "missing";

  it("returns nested values by dot path", () => {
    expect(get(nestedObject, "user.profile.name")).toBe("Jane");
    expect(get(nestedObject, "count")).toBe(0);
  });

  it("returns defaultValue when traversal hits a non-object", () => {
    expect(get(nestedObject, "user.profile.name.first", defaultValue)).toBe(defaultValue);
    expect(get(nestedObject, "count.toString.length", defaultValue)).toBe(defaultValue);
  });

  it("returns null by default when path is invalid", () => {
    expect(get(nestedObject, "user.address.city")).toBeUndefined();
  });

  it("returns undefined when the final key is missing", () => {
    expect(get(nestedObject, "user.profile.age")).toBeUndefined();
  });
});
