import { describe, expect, it } from "vitest";
import { parseRawError } from "../parseRawError";

describe("parseRawError", () => {
  it("parses a string error", () => {
    expect(parseRawError("Lorem ipsum dolor sit amet")).toEqual({
      message: "Lorem ipsum dolor sit amet",
      meta: {},
    });
  });

  it("parses an object error", () => {
    const error = {
      message: "Lorem ipsum dolor sit amet",
      type: "A",
    };

    expect(parseRawError(error)).toEqual({
      message: "Lorem ipsum dolor sit amet",
      meta: { type: "A" },
    });
  });

  it("returns default message for non-standard errors", () => {
    const error = {};

    expect(parseRawError(error)).toEqual({
      message: "Error",
      meta: {},
    });
  });
});
