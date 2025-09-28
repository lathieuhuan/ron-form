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

  describe("_setValue & getValue", () => {
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

    test("_setValue changes value", () => {
      // Set up
      const control = new TestItemControl("");
      // Act
      control["_setValue"](VALID_VALUE);
      // Assert
      expect(control.getValue()).toBe(VALID_VALUE);
    });

    test("_setValue changes value to undefined if value is empty string", () => {
      // Set up
      const control = new TestItemControl("");
      // Act
      control["_setValue"]("");
      // Assert
      expect(control.getValue()).toBeUndefined();
    });
  });

  test("_resetValue sets value to defaultValue, and notifies value observers", () => {
    // Set up
    const control = new TestItemControl("defaultValue");
    control["_setValue"]("newValue");
    // Act
    control["_resetValue"]();
    // Assert
    expect(control.getValue()).toBe("defaultValue");
  });

  test("reset resets value, state & errors, notify state observers by default, case: no validators ", () => {
    // Set up
    const control = new TestItemControl("defaultValue");
    control["_setValue"]("newValue");
    const observer = vi.fn();
    control.subscribeValue(observer);

    // Act
    control.setIsTouched(true);
    control.reset();

    // Assert
    expect(control.getState()).toEqual({
      isTouched: false,
      isPending: false,
      isValid: true,
      isError: false,
      errors: null,
    });
    expect(observer).toHaveBeenCalledOnce();
  });

  test("reset resets value, state & errors, notify state observers by default, case: validators, valid initial value", () => {
    // Set up
    const control = new TestItemControl(VALID_VALUE, {
      validators: [requiredValidator],
    });
    const observer = vi.fn();
    control.subscribeValue(observer);
    // Act
    control.setIsTouched(true);
    control.reset();
    // Assert
    expect(control.getState()).toEqual({
      isTouched: false,
      isPending: false,
      isValid: true,
      isError: false,
      errors: null,
    });
    expect(observer).toHaveBeenCalledOnce();
  });

  test("reset resets value, state & errors, notify state observers by default, case: validators, invalid initial value", () => {
    // Set up
    const control = new TestItemControl(undefined, {
      validators: [requiredValidator],
    });
    const observer = vi.fn();
    control.subscribeValue(observer);
    // Act
    control.setIsTouched(true);
    control.reset();
    // Assert
    expect(control.getState()).toEqual({
      isTouched: false,
      isPending: false,
      isValid: false,
      isError: false,
      errors: REQUIRED_ERROR,
    });
    expect(observer).toHaveBeenCalledOnce();
  });
});
