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

    test("setValue after changes value, will validate and notify value & state observers", () => {
      // Set up
      const control = new TestItemControl("");
      const valueObserver = vi.fn();
      const stateObserver = vi.fn();
      control.subscribeValue(valueObserver);
      control.subscribeState(stateObserver);
      // Act
      control.setValue("123");
      // Assert
      expect(control.getValue()).toBe("123");
      expect(valueObserver).toHaveBeenCalledWith("123");
      expect(stateObserver).toHaveBeenCalledWith(control.getState());
    });

    test("setValue changes value", () => {
      // Set up
      const control = new TestItemControl("");
      const observer = vi.fn();
      control.subscribeValue(observer);
      // Act
      control.setValue(VALID_VALUE);
      // Assert
      expect(control.getValue()).toBe(VALID_VALUE);
      expect(observer).toHaveBeenCalledWith(VALID_VALUE);
    });

    test("setValue changes value to undefined if value is empty string", () => {
      // Set up
      const control = new TestItemControl("");
      const observer = vi.fn();
      control.subscribeValue(observer);
      // Act
      control.setValue("");
      // Assert
      expect(control.getValue()).toBeUndefined();
      expect(observer).toHaveBeenCalledWith(undefined);
    });
  });

  test("resetValue sets value to defaultValue, and notifies value observers", () => {
    // Set up
    const control = new TestItemControl("defaultValue");
    control.setValue("newValue");
    // Act
    const observer = vi.fn();
    control.subscribeValue(observer);
    control.resetValue();
    // Assert
    expect(control.getValue()).toBe("defaultValue");
    expect(observer).toHaveBeenCalledWith("defaultValue");
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
