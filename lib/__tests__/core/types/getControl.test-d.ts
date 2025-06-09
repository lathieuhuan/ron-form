import { describe } from "node:test";
import { expectTypeOf, test } from "vitest";

import {
  setupMatrix2dComplex,
  setupMatrix2dSimple,
  setupMatrix3dComplex,
  setupMatrix3dSimple,
  setupNestedGroup,
  setupResume,
} from "@lib/__tests__/test_utils";
import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { ListControl } from "@lib/core/list_control";

type ExperienceControl = GroupControl<{
  company: ItemControl<string>;
  yearCount: ItemControl<number>;
}>;

describe("getControl", () => {
  const resume = setupResume();

  test("single paths on GroupControl", () => {
    expectTypeOf(resume.getControl(["role"])).toEqualTypeOf<ItemControl<string>>();
    expectTypeOf(resume.getControl(["general"])).toEqualTypeOf<
      GroupControl<{
        name: ItemControl<string>;
        age: ItemControl<number>;
      }>
    >();
    expectTypeOf(resume.getControl(["skills"])).toEqualTypeOf<ListControl<ItemControl<string>>>();
    expectTypeOf(resume.getControl(["experiences"])).toEqualTypeOf<
      ListControl<ExperienceControl>
    >();
    // @ts-expect-error invalid: key not match
    resume.getControl(["abc"]);
    // @ts-expect-error invalid: redundant key string
    resume.getControl(["role", "xyz"]);
    // @ts-expect-error invalid: redundant key number
    resume.getControl(["role", 0]);
  });

  test("complex paths on GroupControl", () => {
    expectTypeOf(resume.getControl(["general", "name"])).toEqualTypeOf<ItemControl<string>>();
    expectTypeOf(resume.getControl(["general", "age"])).toEqualTypeOf<ItemControl<number>>();
    expectTypeOf(resume.getControl(["contact", "email"])).toEqualTypeOf<ItemControl<string>>();
    // @ts-expect-error invalid: key not match
    resume.getControl(["general", "email"]);
    // @ts-expect-error invalid: key not match
    resume.getControl(["general", 0]);
    // @ts-expect-error invalid: redundant key string
    resume.getControl(["general", "name", "abc"]);
    // @ts-expect-error invalid: redundant key number
    resume.getControl(["general", "name", 0]);

    expectTypeOf(resume.getControl(["skills", 0])).toEqualTypeOf<ItemControl<string> | undefined>();
    expectTypeOf(resume.getControl(["experiences", 0])).toEqualTypeOf<
      ExperienceControl | undefined
    >();
    expectTypeOf(resume.getControl(["experiences", 0, "company"])).toEqualTypeOf<
      ItemControl<string> | undefined
    >();
    // @ts-expect-error invalid: key not match
    resume.getControl(["experiences", "abc"]);
    // @ts-expect-error invalid: key not match
    resume.getControl(["experiences", 0, 1]);
    // @ts-expect-error invalid: redundant key string
    resume.getControl(["experiences", 0, "company", "abc"]);
    // @ts-expect-error invalid: redundant key number
    resume.getControl(["experiences", 0, "company", 0]);
  });

  test("paths on ListControl", () => {
    const experiences = resume.getControl(["experiences"]);

    expectTypeOf(experiences.getControl([0])).toEqualTypeOf<ExperienceControl | undefined>();
    expectTypeOf(experiences.getControl([0, "company"])).toEqualTypeOf<
      ItemControl<string> | undefined
    >();
    // @ts-expect-error invalid: key not match
    experiences.getControl(["abc"]);
    // @ts-expect-error invalid: key not match
    experiences.getControl([0, "xyz"]);
    // @ts-expect-error invalid: redundant key string
    experiences.getControl([0, "company", "abc"]);
    // @ts-expect-error invalid: redundant key number
    experiences.getControl([0, "company", 0]);
  });

  test("deep nested paths", () => {
    const deepGroup = setupNestedGroup();

    expectTypeOf(deepGroup).toEqualTypeOf<
      GroupControl<{
        lv1: GroupControl<{
          lv2: ItemControl<string>;
        }>;
      }>
    >();
    expectTypeOf(deepGroup.getControl(["lv1"])).toEqualTypeOf<
      GroupControl<{
        lv2: ItemControl<string>;
      }>
    >();
    expectTypeOf(deepGroup.getControl(["lv1", "lv2"])).toEqualTypeOf<ItemControl<string>>();
  });

  test("simple 2d matrix paths", () => {
    const matrix2d = setupMatrix2dSimple();

    expectTypeOf(matrix2d).toEqualTypeOf<ListControl<ListControl<ItemControl<number>>>>();
    expectTypeOf(matrix2d.getControl([0])).toEqualTypeOf<
      ListControl<ItemControl<number>> | undefined
    >();
    expectTypeOf(matrix2d.getControl([0, 0])).toEqualTypeOf<ItemControl<number> | undefined>();
    // @ts-expect-error invalid: key not match
    matrix2d.getControl(["abc"]);
    // @ts-expect-error invalid: key not match
    matrix2d.getControl([0, "xyz"]);
    // @ts-expect-error invalid: redundant key string
    matrix2d.getControl([0, 0, "abc"]);
    // @ts-expect-error invalid: redundant key number
    matrix2d.getControl([0, 0, 0]);

    // Matrix as group child to check [string, number, number...]
    const container = new GroupControl({
      matrix: matrix2d,
    });

    expectTypeOf(container.getControl(["matrix", 0, 0])).toEqualTypeOf<
      ItemControl<number> | undefined
    >();
  });

  test("complex 2d matrix paths", () => {
    const matrixPoint = setupMatrix2dComplex();

    expectTypeOf(matrixPoint).toEqualTypeOf<
      ListControl<
        ListControl<
          GroupControl<{
            x: ItemControl<number>;
            y: ItemControl<number>;
          }>
        >
      >
    >();
    expectTypeOf(matrixPoint.getControl([0, 0, "x"])).toEqualTypeOf<
      ItemControl<number> | undefined
    >();
    // @ts-expect-error invalid: key not match
    matrixPoint.getControl(["abc"]);
    // @ts-expect-error invalid: key not match
    matrixPoint.getControl([0, "xyz"]);
    // @ts-expect-error invalid: key not match
    matrixPoint.getControl([0, 0, "abc"]);
    // @ts-expect-error invalid: key not match
    matrixPoint.getControl([0, 0, 0]);
    // @ts-expect-error invalid: redundant key string
    matrixPoint.getControl([0, 0, "x", "abc"]);
    // @ts-expect-error invalid: redundant key number
    matrixPoint.getControl([0, 0, "x", 0]);
  });

  test("simple 3d matrix paths", () => {
    const matrix3d = setupMatrix3dSimple();

    expectTypeOf(matrix3d).toEqualTypeOf<
      ListControl<ListControl<ListControl<ItemControl<number>>>>
    >();
    expectTypeOf(matrix3d.getControl([0, 0, 0])).toEqualTypeOf<ItemControl<number> | undefined>();
    // @ts-expect-error invalid: key not match
    matrix3d.getControl([0, "xyz"]);
    // @ts-expect-error invalid: key not match
    matrix3d.getControl([0, 0, "abc"]);
    // @ts-expect-error invalid: redundant key string
    matrix3d.getControl([0, 0, 0, "abc"]);
    // @ts-expect-error invalid: redundant key number
    matrix3d.getControl([0, 0, 0, 0]);

    const container = new GroupControl({
      matrix: matrix3d,
    });

    expectTypeOf(container.getControl(["matrix", 0, 0, 0])).toEqualTypeOf<
      ItemControl<number> | undefined
    >();
  });

  test("complex 3d matrix paths", () => {
    const matrixPoint = setupMatrix3dComplex();

    expectTypeOf(matrixPoint).toEqualTypeOf<
      ListControl<
        ListControl<
          ListControl<
            GroupControl<{
              x: ItemControl<number>;
              y: ItemControl<number>;
            }>
          >
        >
      >
    >();
    expectTypeOf(matrixPoint.getControl([0, 0, 0, "x"])).toEqualTypeOf<
      ItemControl<number> | undefined
    >();
    // @ts-expect-error invalid: key not match
    matrixPoint.getControl([0, "abc"]);
    // @ts-expect-error invalid: key not match
    matrixPoint.getControl([0, 0, "xyx"]);
    // @ts-expect-error invalid: key not match
    matrixPoint.getControl([0, 0, 0, "www"]);
  });
});
