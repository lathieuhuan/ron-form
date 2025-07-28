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

  describe("setValue & getValue", () => {
    test("getValue returns value when value is not empty string", () => {
      // Set up
      const control = new TestItemControl(VALID_VALUE);
      // Assert
      expect(control.getValue()).toBe(VALID_VALUE);
    });

    test("getValue returns undefined when value is empty string", () => {
      // Set up
      const control = new TestItemControl("");
      // Assert
      expect(control.getValue()).toBeUndefined();
    });

    test("setValue sets value, does not notify value observers", () => {
      // Set up
      const control = new TestItemControl("");
      const observer = vi.fn();
      control.subscribeValue(observer);
      // Act
      control.setValue(VALID_VALUE);
      // Assert
      expect(control.getValue()).toBe(VALID_VALUE);
      expect(observer).not.toHaveBeenCalled();
    });

    test("setValue sets value undefined if value is empty string, still does not notify value observers", () => {
      // Set up
      const control = new TestItemControl("");
      const observer = vi.fn();
      control.subscribeValue(observer);
      // Act
      control.setValue("");
      // Assert
      expect(control.getValue()).toBeUndefined();
      expect(observer).not.toHaveBeenCalled();
    });
  });

  test("resetValue sets value to defaultValue, does not notify value observers", () => {
    // Set up
    const control = new TestItemControl("defaultValue");
    const observer = vi.fn();
    control.subscribeValue(observer);
    // Act
    control.setValue("newValue");
    control.resetValue();
    // Assert
    expect(control.getValue()).toBe("defaultValue");
    expect(observer).not.toHaveBeenCalled();
  });

  test("resetState resets state & errors, does not notify state observers [no validators]", () => {
    // Set up
    const control = new TestItemControl();
    const observer = vi.fn();
    control.subscribeValue(observer);
    // Act
    control.setIsTouched(true);
    control.resetState();
    // Assert
    expect(control.getState()).toEqual({
      isTouched: false,
      isPending: false,
      isValid: true,
      isError: false,
      errors: null,
    });
    expect(observer).not.toHaveBeenCalled();
  });

  test("resetState resets state & errors, does not notify state observers [validators, valid initial value]", () => {
    // Set up
    const control = new TestItemControl(VALID_VALUE, {
      validators: [requiredValidator],
    });
    const observer = vi.fn();
    control.subscribeValue(observer);
    // Act
    control.setIsTouched(true);
    control.resetState();
    // Assert
    expect(control.getState()).toEqual({
      isTouched: false,
      isPending: false,
      isValid: true,
      isError: false,
      errors: null,
    });
    expect(observer).not.toHaveBeenCalled();
  });

  test("resetState resets state & errors, does not notify state observers [validators, invalid initial value]", () => {
    // Set up
    const control = new TestItemControl(undefined, {
      validators: [requiredValidator],
    });
    const observer = vi.fn();
    control.subscribeValue(observer);
    // Act
    control.setIsTouched(true);
    control.resetState();
    // Assert
    expect(control.getState()).toEqual({
      isTouched: false,
      isPending: false,
      isValid: false,
      isError: false,
      errors: REQUIRED_ERROR,
    });
    expect(observer).not.toHaveBeenCalled();
  });
});
