import { describe, expect, test } from "vitest";
import { ListControl } from "../ListControl";
import { ItemControl } from "../../ItemControl";
import { requiredValidator } from "@lib/core/test-utils/validation-utils";

describe("ListControl", () => {
  describe("constructor", () => {
    test("initial state with no validators", () => {
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

    test("initial state with initial values", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["xxx"],
      });

      // Assert
      expect(control.items.length).toBe(1);
      expect(control.getControl([0])?.getValue()).toBe("xxx");
      expect(control.getValue()).toEqual(["xxx"]);
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    test("initial state with validators & initial valid values", () => {
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

    test("initial state with validators & initial invalid values", () => {
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

    test("initial state with initial values & initial child control that has validators and initial valid values", () => {
      // Set up
      const item = new ItemControl<string>("abc", {
        validators: [requiredValidator],
      });
      const control = new ListControl(item, {
        initialValues: ["abc"],
      });

      // Assert
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual({ error: "error" });
    });
  });
});
