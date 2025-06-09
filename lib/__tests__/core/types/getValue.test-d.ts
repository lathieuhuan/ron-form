import { describe } from "node:test";
import { expectTypeOf, test } from "vitest";

import {
  setupMatrix2dComplex,
  setupMatrix2dSimple,
  setupMatrix3dComplex,
  setupMatrix3dSimple,
  setupResume,
} from "@lib/__tests__/test_utils";
import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { ListControl } from "@lib/core/list_control";

type ExperienceControl = GroupControl<{
  company: ItemControl<string>;
  yearCount: ItemControl<number>;
}>;

type ExperienceValue = {
  company: string;
  yearCount: number;
};

describe("getValue", () => {
  const { resume, role, general, skills, experiences } = setupResume();

  test("simple paths", () => {
    expectTypeOf(role.getValue()).toEqualTypeOf<string>();
    expectTypeOf(general.getValue()).toEqualTypeOf<{
      name: string;
      age: number;
    }>();
    expectTypeOf(skills.getValue()).toEqualTypeOf<string[]>();
    expectTypeOf(experiences.getValue()).toEqualTypeOf<ExperienceValue[]>();
  });

  test("nested simple paths", () => {
    const nameCtrl = general.getControl(["name"]);
    const ageCtrl = general.getControl(["age"]);
    const skill0Ctrl = skills.getControl([0]);
    const experience0Ctrl = experiences.getControl([0]);

    expectTypeOf(nameCtrl.getValue()).toEqualTypeOf<string>();
    expectTypeOf(ageCtrl.getValue()).toEqualTypeOf<number>();
    expectTypeOf(skill0Ctrl?.getValue()).toEqualTypeOf<string | undefined>();
    expectTypeOf(experience0Ctrl?.getValue()).toEqualTypeOf<ExperienceValue | undefined>();
  });

  test("nested complex paths", () => {
    const experience0Ctrl = resume.getControl(["experiences", 0]);
    const companyCtrl = resume.getControl(["experiences", 0, "company"]);

    expectTypeOf(experience0Ctrl?.getValue()).toEqualTypeOf<ExperienceValue | undefined>();
    expectTypeOf(companyCtrl?.getValue()).toEqualTypeOf<string | undefined>();
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
