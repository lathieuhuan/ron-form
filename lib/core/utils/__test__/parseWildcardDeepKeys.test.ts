import { describe, expect, it } from "vitest";
import { parseWildcardDeepKeys } from "../parseWildcardDeepKeys";

describe("parseWildcardDeepKeys", () => {
  it("parses <object>.<leaf>", () => {
    const field = "a.b";
    const values = { a: { b: 1 } };
    const keys = parseWildcardDeepKeys<typeof values>(field, values);
    expect(keys).toEqual(["a.b"]);
  });

  it("parses <object>.<array|leaf>", () => {
    const field = "a.[n]";
    const values = { a: [1, 2, 3] };
    const keys = parseWildcardDeepKeys<typeof values>(field, values);
    expect(keys).toEqual(["a.0", "a.1", "a.2"]);
  });

  it("parses <object>.<array>.<leaf>", () => {
    const field = "a.[n].b";
    const values = {
      a: [{ b: 1 }, { b: 2 }],
    };
    const keys = parseWildcardDeepKeys<typeof values>(field, values);
    expect(keys).toEqual(["a.0.b", "a.1.b"]);
  });

  it("parses <object>.<array>.<object>.<array|leaf>", () => {
    const field = "a.[n].b.[n]";
    const values = {
      a: [
        {
          b: [1, 2, 3],
        },
        {
          b: [4, 5, 6],
        },
      ],
    };
    const keys = parseWildcardDeepKeys<typeof values>(field, values);
    expect(keys).toEqual(["a.0.b.0", "a.0.b.1", "a.0.b.2", "a.1.b.0", "a.1.b.1", "a.1.b.2"]);
  });

  it("parses <object>.<array>.<array>.<leaf>", () => {
    const field = "a.[n].[n].c";
    const values = {
      a: [
        [{ c: 1 }, { c: 2 }],
        [
          {
            c: 3,
          },
        ],
      ],
    };
    const keys = parseWildcardDeepKeys<typeof values>(field, values);
    expect(keys).toEqual(["a.0.0.c", "a.0.1.c", "a.1.0.c"]);
  });
});
