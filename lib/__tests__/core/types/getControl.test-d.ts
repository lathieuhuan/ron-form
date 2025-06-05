import { describe } from "node:test";
import { expectTypeOf, test } from "vitest";

import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { ListControl } from "@lib/core/list_control";

const resume = new GroupControl({
  role: new ItemControl("Software Engineer"),
  general: new GroupControl({
    name: new ItemControl("John Doe"),
    age: new ItemControl(30),
  }),
  contact: new GroupControl({
    email: new ItemControl("john.doe@example.com"),
    phone: new ItemControl("123-456-7890"),
  }),
  skills: new ListControl(new ItemControl("")),
  experiences: new ListControl(
    new GroupControl({
      company: new ItemControl(""),
      yearCount: new ItemControl(0),
    }),
  ),
  matrix: new ListControl(new ListControl(new ItemControl(0))),
});

type ExperienceControl = GroupControl<{
  company: ItemControl<string>;
  yearCount: ItemControl<number>;
}>;

describe("getControl", () => {
  //
  test("simple paths", () => {
    expectTypeOf(resume.getControl(["role"])).toEqualTypeOf<ItemControl<string>>();
    // IN_PROGRESS
    // expectTypeOf(resume.getControl(["general"])).toEqualTypeOf<
    //   GroupControl<{
    //     name: ItemControl<string>;
    //     age: ItemControl<number>;
    //   }>
    // >();
    expectTypeOf(resume.getControl(["skills"])).toEqualTypeOf<ListControl<ItemControl<string>>>();
    // @ts-expect-error invalid: key not match
    resume.getControl(["abc"]);
    // @ts-expect-error invalid: redundant key string
    resume.getControl(["role", "xyz"]);
    // @ts-expect-error invalid: redundant key number
    resume.getControl(["role", 0]);
  });

  test("nested simple paths", () => {
    expectTypeOf(resume.getControl(["general", "name"])).toEqualTypeOf<ItemControl<string>>();
    expectTypeOf(resume.getControl(["general", "age"])).toEqualTypeOf<ItemControl<number>>();
    expectTypeOf(resume.getControl(["contact", "email"])).toEqualTypeOf<ItemControl<string>>();
    expectTypeOf(resume.getControl(["skills", 0])).toEqualTypeOf<ItemControl<string> | undefined>();
    // @ts-expect-error invalid: key not match
    resume.getControl(["general", "email"]);
    // @ts-expect-error invalid: key not match
    resume.getControl(["general", 0]);
    // @ts-expect-error invalid: redundant key string
    resume.getControl(["general", "name", "abc"]);
    // @ts-expect-error invalid: redundant key number
    resume.getControl(["general", "name", 0]);
  });

  test("nested complex paths", () => {
    expectTypeOf(resume.getControl(["experiences"])).toEqualTypeOf<
      ListControl<ExperienceControl>
    >();
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

  test("list paths", () => {
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

  test("simple 2d matrix paths", () => {
    const matrix2d = new ListControl(new ListControl(new ItemControl(0)));

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
    const matrixPoint = new ListControl(
      new ListControl(
        new GroupControl({
          x: new ItemControl(0),
          y: new ItemControl(0),
        }),
      ),
    );

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
    const matrix3d = new ListControl(new ListControl(new ListControl(new ItemControl(0))));

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
    const matrixPoint = new ListControl(
      new ListControl(
        new ListControl(
          new GroupControl({
            x: new ItemControl(0),
            y: new ItemControl(0),
          }),
        ),
      ),
    );

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
