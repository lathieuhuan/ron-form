import { describe, expect, it, test, vi } from "vitest";
import { REQUIRED_ERROR, requiredValidator } from "../../test_utils";
import { TestItemControl } from "./test_item_control";

describe("ItemControl", () => {
  const VALID_VALUE = "xxx";

  describe("constructor", () => {
    test("initial state with no validators", () => {
      // Set up
      const control = new TestItemControl("");
      // Assert
      expect(control.getValue()).toBeUndefined();
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsPending()).toBe(false);
      expect(control.errors).toEqual(null);
    });

    test("initial state with validators and invalid initial value", () => {
      // Set up
      const control = new TestItemControl(undefined, {
        validators: [requiredValidator],
      });
      // Assert
      expect(control.getValue()).toBeUndefined();
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(false);
      expect(control.getIsPending()).toBe(false);
      expect(control.errors).toEqual(REQUIRED_ERROR);
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
      expect(control.errors).toEqual(null);
    });
  });

  test("setIsTouched", () => {
    // Set up
    const control = new TestItemControl("");
    // Act
    control.setIsTouched(true);
    // Assert
    expect(control.getIsTouched()).toBe(true);
  });

  describe("setValue", () => {
    it("updates value", () => {
      // Set up
      const control = new TestItemControl("");
      // Act
      control.setValue(VALID_VALUE);
      // Assert
      expect(control.getValue()).toBe(VALID_VALUE);
    });

    it("notifies observers", () => {
      // Set up
      const control = new TestItemControl("");
      const observer = vi.fn();
      control.subscribe(observer);
      // Act
      control.setValue(VALID_VALUE);
      // Assert
      expect(observer).toHaveBeenCalledWith(VALID_VALUE);
    });

    it("when field is not touched turns isTouched to true and notify state observers", () => {
      // Set up
      const control = new TestItemControl("");
      const observer = vi.fn();
      control.subscribeState(observer);
      expect(control.getIsTouched()).toBe(false);
      // Act
      control.setValue(VALID_VALUE);
      // Assert
      expect(control.getIsTouched()).toBe(true);
      expect(observer).toHaveBeenCalledWith(control.getState());
    });

    it("when field is touched does not notify state observers", () => {
      // Set up
      const control = new TestItemControl("");
      const observer = vi.fn();
      control.subscribeState(observer);
      // Act
      control.setIsTouched(true);
      control.setValue(VALID_VALUE);
      // Assert
      expect(observer).not.toHaveBeenCalled();
    });
  });

  test("resetValue to defaultValue and notifies observers", () => {
    // Set up
    const control = new TestItemControl(VALID_VALUE);
    const observer = vi.fn();
    control.subscribe(observer);
    // Act
    control.resetValue();
    // Assert
    expect(control.getValue()).toBe(control.defaultValue);
    expect(observer).toHaveBeenCalledWith(control.defaultValue);
  });

  test("resetState turns isTouched to false", () => {
    // Set up
    const control = new TestItemControl("");
    // Act
    control.setIsTouched(true);
    control.resetState();
    // Assert
    expect(control.getIsTouched()).toBe(false);
  });

  test("reset value and state, and notifies observers and state observers", () => {
    // Set up
    const control = new TestItemControl(VALID_VALUE, {
      validators: [requiredValidator],
    });
    const observer = vi.fn();
    const stateObserver = vi.fn();
    const prevIsValid = control.getIsValid();
    const prevErrors = control.errors;
    control.subscribe(observer);
    control.subscribeState(stateObserver);
    // Act
    control.reset();
    // Assert
    expect(control.getValue()).toBe(control.defaultValue);
    expect(control.getIsTouched()).toBe(false);
    expect(control.getIsValid()).toBe(prevIsValid);
    expect(control.getIsPending()).toBe(false);
    expect(control.errors).toEqual(prevErrors);
    expect(observer).toHaveBeenCalledWith(control.defaultValue);
    expect(stateObserver).toHaveBeenCalledWith(control.getState());
  });

  describe("validateSync", () => {
    it("turns isTouched to true by default", () => {
      // Set up
      const control = new TestItemControl<string>();
      expect(control.getIsTouched()).toBe(false);

      // Act
      control.validateSync();

      // Assert
      expect(control.getIsTouched()).toBe(true);
    });

    it("does not turn isTouched to true when shouldTouch is false", () => {
      // Set up
      const control = new TestItemControl<string>();
      expect(control.getIsTouched()).toBe(false);

      // Act
      control.validateSync({ shouldTouch: false });

      // Assert
      expect(control.getIsTouched()).toBe(false);
    });
  });
});
