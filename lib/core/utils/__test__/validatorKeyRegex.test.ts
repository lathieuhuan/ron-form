import { describe, expect, it } from "vitest";
import { validatorKeyRegex } from "../validatorKeyRegex";

describe("validatorKeyRegex", () => {
  it("should match the path itself", () => {
    const regex1 = validatorKeyRegex("a.b.c");
    expect(regex1.test("a.b.c")).toBe(true);

    const regex2 = validatorKeyRegex("a.1.b");
    expect(regex2.test("a.1.b")).toBe(true);

    const regex3 = validatorKeyRegex("a.1.b.2");
    expect(regex3.test("a.1.b.2")).toBe(true);

    const regex4 = validatorKeyRegex("a.2.1");
    expect(regex4.test("a.2.1")).toBe(true);
  });

  it("should match generic item path", () => {
    const regex1 = validatorKeyRegex("a.1.b");
    expect(regex1.test("a.[n].b")).toBe(true);

    const regex2 = validatorKeyRegex("a.1.b.3");
    expect(regex2.test("a.[n].b.[n]")).toBe(true);

    const regex3 = validatorKeyRegex("a.1.b.3");
    expect(regex3.test("a.1.b.[n]")).toBe(true);

    const regex4 = validatorKeyRegex("a.1.b.3");
    expect(regex4.test("a.[n].b.3")).toBe(true);

    const regex5 = validatorKeyRegex("a.2.1");
    expect(regex5.test("a.[n].[n]")).toBe(true);
  });

  it("should match other item paths", () => {
    const regex1 = validatorKeyRegex("a.1.b");
    expect(regex1.test("a.2.b")).toBe(false);

    const regex2 = validatorKeyRegex("a.1.b.4");
    expect(regex2.test("a.1.b.2")).toBe(false);
    expect(regex2.test("a.3.b.4")).toBe(false);
  })

  it("should not match extended paths", () => {
    const regex1 = validatorKeyRegex("a.1.b");
    expect(regex1.test("a.1.b.c")).toBe(false);
    expect(regex1.test("a.[n].b.c")).toBe(false);
    expect(regex1.test("a.1.b.[n]")).toBe(false);
  });
});
