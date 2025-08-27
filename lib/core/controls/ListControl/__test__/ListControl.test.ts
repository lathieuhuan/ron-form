import { setupResume } from "@lib/core/test-utils/parent-utils";
import { describe, expect, test } from "vitest";
import { ItemControl } from "../../ItemControl";
import { ListControl } from "../ListControl";

describe("ListControl", () => {
  describe("constructor", () => {
    test("default initial state", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>());

      // Assert
      expect(control.items.length).toBe(0);
      expect(control.getValue()).toEqual(undefined);
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsPending()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    describe("when passed initialValues, should create item controls as many as initialValues", () => {
      test("each control should have the corresponding initial value", () => {
        // Set up
        const control = new ListControl(new ItemControl<string>(), {
          initialValues: ["111", "222", "333"],
        });

        // Assert
        expect(control.items.length).toBe(3);
        expect(control.getControl([0])?.getValue()).toBe("111");
        expect(control.getControl([1])?.getValue()).toBe("222");
        expect(control.getControl([2])?.getValue()).toBe("333");
        expect(control.getValue()).toEqual(["111", "222", "333"]);
        expect(control.getIsTouched()).toBe(false);
        expect(control.getIsValid()).toBe(true);
        expect(control.getIsError()).toBe(false);
        expect(control.getErrors()).toEqual(null);
      });

      test("when an initial value is undefined, the item control should has its initial value", () => {
        // Set up
        const control = new ListControl(new ItemControl<string>("item"), {
          initialValues: ["abc", undefined],
        });

        // Assert
        expect(control.items.length).toBe(2);
        expect(control.getControl([0])?.getValue()).toBe("abc");
        expect(control.getControl([1])?.getValue()).toBe("item");
        expect(control.getValue()).toEqual(["abc", "item"]);
      });
    });

    test("initial state with validators & valid initialValues", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["abc"],
        validators: [(c) => (c.getValue()?.at(0) === "xxx" ? { error: "error" } : null)],
      });

      // Assert
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    test("initial state with validators & invalid initialValues", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["xxx"],
        validators: [(c) => (c.getValue()?.at(0) === "xxx" ? { error: "error" } : null)],
      });

      // Assert
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual({ error: "error" });
    });
  });

  // test("getControl", () => {
  //   // Set up
  //   const { skills } = setupResume();

  //   // Act
  //   skills.insertItems(["111", "222"]);
  // });
});
