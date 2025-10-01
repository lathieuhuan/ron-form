import { REQUIRED_ERROR, requiredValidator } from "@lib/core/test-utils/validation-utils";
import { describe, expect, test, vi } from "vitest";
import { TestItemControl } from "./TestItemControl";

describe("ItemControl", () => {
  const VALID_VALUE = "xxx";

  describe("constructor", () => {
    test("initial state with no validators", () => {
      // Set up
      const control = new TestItemControl("");
      // Assert
      expect(control.getValue()).toBeUndefined();
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsPending()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getErrors()).toEqual(null);
    });

    test("initial state with validators and valid initial value", () => {
      // Set up
      const control = new TestItemControl(VALID_VALUE, {
        validators: [requiredValidator],
      });
      // Assert
      expect(control.getValue()).toBe(VALID_VALUE);
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsPending()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    test("initial state with validators and invalid initial value", () => {
      // Set up
      const control = new TestItemControl(undefined, {
        validators: [requiredValidator],
      });
      // Assert
      expect(control.getValue()).toBeUndefined();
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsPending()).toBe(false);
      expect(control.getIsValid()).toBe(false);
      expect(control.getErrors()).toEqual(REQUIRED_ERROR);
    });
  });

  test("setIsTouched & getIsTouched", () => {
    // Set up
    const control = new TestItemControl("");
    expect(control.getIsTouched()).toBe(false);
    // Act
    control.setIsTouched(true);
    // Assert
    expect(control.getIsTouched()).toBe(true);
    // Act
    control.setIsTouched(false);
    // Assert
    expect(control.getIsTouched()).toBe(false);
  });

  test("getIsError returns !isValid & isTouched", () => {
    // Set up
    const control = new TestItemControl(undefined, {
      validators: [requiredValidator],
    });
    // Assert
    expect(control.getIsError()).toBe(false);
    // Act
    control.setIsTouched(true);
    // Assert
    expect(control.getIsError()).toBe(true);
  });

  test("getValue returns value", () => {
    // Set up
    const control = new TestItemControl(VALID_VALUE);
    // Assert
    expect(control.getValue()).toBe(VALID_VALUE);
  });

  test("setValue changes value and calls onValueChange", () => {
    // Set up
    const control = new TestItemControl("");
    const onValueChange = vi.fn();
    control["onValueChange"] = onValueChange;

    // Act
    control.setValue(VALID_VALUE);

    // Assert
    expect(control.getValue()).toBe(VALID_VALUE);
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  test("patchValue changes value and calls onValueChange", () => {
    // Set up
    const control = new TestItemControl("");
    const onValueChange = vi.fn();
    control["onValueChange"] = onValueChange;

    // Act
    control.patchValue(VALID_VALUE);

    // Assert
    expect(control.getValue()).toBe(VALID_VALUE);
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  test("resetValue sets value to defaultValue, and calls onValueChange", () => {
    // Set up
    const control = new TestItemControl("defaultValue");
    control.setValue("newValue");
    const onValueChange = vi.fn();
    control["onValueChange"] = onValueChange;

    // Act
    control.resetValue();

    // Assert
    expect(control.getValue()).toBe("defaultValue");
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  test("reset resets value & state, and calls onValueChange", () => {
    // Set up
    const control = new TestItemControl(VALID_VALUE, {
      validators: [requiredValidator],
    });
    control.setValue(undefined);
    control.validate();

    expect(control.getValue()).toBeUndefined();
    expect(control.getIsTouched()).toBe(true);
    expect(control.getIsValid()).toBe(false);
    expect(control.getErrors()).toEqual(REQUIRED_ERROR);

    const onValueChange = vi.fn();
    control["onValueChange"] = onValueChange;

    // Act
    control.reset();

    // Assert
    expect(control.getState()).toEqual({
      isTouched: false,
      isPending: false,
      isValid: true,
      isError: false,
      errors: null,
    });
    expect(onValueChange).toHaveBeenCalledOnce();
  });
});
