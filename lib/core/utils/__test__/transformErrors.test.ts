import { describe, expect, it } from "vitest";
import { transformErrors } from "../transformErrors";

describe("transformErrors", () => {
  const field = "user.email";

  it("transforms a single string message", () => {
    expect(transformErrors(field, "change", "Required")).toEqual([
      {
        path: field,
        type: "change",
        message: "Required",
        meta: {},
      },
    ]);
  });

  it("transforms an array of messages", () => {
    expect(transformErrors(field, "change", ["Required", "Invalid format"])).toEqual([
      {
        path: field,
        type: "change",
        message: "Required",
        meta: {},
      },
      {
        path: field,
        type: "change",
        message: "Invalid format",
        meta: {},
      },
    ]);
  });

  it("transforms an object error, other fields beside message are collected into meta", () => {
    const error = {
      message: "Required",
      code: "required",
    };

    expect(transformErrors(field, "change", error)).toEqual([
      {
        path: field,
        type: "change",
        message: "Required",
        meta: { code: "required" },
      },
    ]);
  });

  it("returns an empty array for null or undefined messages", () => {
    expect(transformErrors(field, "change", null)).toEqual([]);
    expect(transformErrors(field, "change", undefined)).toEqual([]);
  });
});
