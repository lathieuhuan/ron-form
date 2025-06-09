import { describe } from "node:test";
import { expectTypeOf, test } from "vitest";

import {
  setupMatrix2dComplex,
  setupMatrix2dSimple,
  setupMatrix3dComplex,
  setupMatrix3dSimple,
  setupResume,
} from "@lib/__tests__/test_utils";
import { ItemControl } from "@lib/core/item_control";
import { GroupValue } from "@lib/core/types";

type ExperienceValue = {
  company: string;
  yearCount: number;
};

describe("getValue", () => {
  const resume = setupResume();

  test("getValue", () => {
    // ItemControl
    const role = resume.getControl(["role"]);
    expectTypeOf(role.getValue()).toEqualTypeOf<string>();

    // GroupControl
    const general = resume.getControl(["general"]);
    expectTypeOf(general.getValue()).toEqualTypeOf<{
      name: string;
      age: number;
    }>();

    // ListControl of ItemControl
    const skills = resume.getControl(["skills"]);
    expectTypeOf(skills.getValue()).toEqualTypeOf<string[]>();

    // ListControl of GroupControl
    const experiences = resume.getControl(["experiences"]);
    expectTypeOf(experiences.getValue()).toEqualTypeOf<ExperienceValue[]>();

    // ListControl of ListControl of ItemControl
    const matrix2d = setupMatrix2dSimple();
    expectTypeOf(matrix2d.getValue()).toEqualTypeOf<number[][]>();

    // ListControl of ListControl of GroupControl
    const matrix2dComplex = setupMatrix2dComplex();
    expectTypeOf(matrix2dComplex.getValue()).toEqualTypeOf<
      GroupValue<{
        x: ItemControl<number>;
        y: ItemControl<number>;
      }>[][]
    >();

    // ListControl of ListControl of ListControl of ItemControl
    const matrix3d = setupMatrix3dSimple();
    expectTypeOf(matrix3d.getValue()).toEqualTypeOf<number[][][]>();

    // ListControl of ListControl of ListControl of GroupControl
    const matrix3dComplex = setupMatrix3dComplex();
    expectTypeOf(matrix3dComplex.getValue()).toEqualTypeOf<
      GroupValue<{
        x: ItemControl<number>;
        y: ItemControl<number>;
      }>[][][]
    >();
  });
});
