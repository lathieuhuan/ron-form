import { describe, expect, it } from "vitest";
import { transformErrors } from "../transformErrors";

describe("transformErrors", () => {
  const field = "user.email";
  const errorType = "change" as const;
  const singleMessage = "Required";
  const multipleMessages = ["Required", "Invalid format"];

  it("transforms a single string message", () => {
    expect(transformErrors(field, errorType, singleMessage)).toEqual([
      {
        path: field,
        type: errorType,
        message: singleMessage,
        meta: {},
      },
    ]);
  });

  it("transforms an array of messages", () => {
    expect(transformErrors(field, errorType, multipleMessages)).toEqual([
      {
        path: field,
        type: errorType,
        message: "Required",
        meta: {},
      },
      {
        path: field,
        type: errorType,
        message: "Invalid format",
        meta: {},
      },
    ]);
  });

  it("returns an empty array for null or undefined messages", () => {
    expect(transformErrors(field, errorType, null)).toEqual([]);
    expect(transformErrors(field, errorType, undefined)).toEqual([]);
  });
});
