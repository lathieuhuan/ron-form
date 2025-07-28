import { GroupControl } from "@lib/core/controls/GroupControl";
import {
  makeRequiredAsyncValidator,
  requiredAsyncValidator,
  requiredValidator,
} from "@lib/core/test-utils/validation-utils";
import { ControlState } from "@lib/core/types";
import { describe, expect, it, test, vi } from "vitest";
import { TestParentControl } from "./TestParentControl";

describe("ParentControl", () => {
  describe("getIsValid", () => {
    test("getIsValid returns false if one of the children is invalid", () => {
      // Set up
      const control = new TestParentControl();
      expect(control.getIsValid()).toBe(true);

      // Act
      const first = control.getControl([0]);
      const second = control.getControl([1]);
      first.addValidator(requiredValidator);
      const error = first.validateSync();
      first.setErrors(error);
      expect(first.getIsValid()).toEqual(false);
      expect(second.getIsValid()).toEqual(true);

      // Assert
      expect(control.getIsValid()).toEqual(false);
    });

    test("getIsValid returns false if itself is invalid, regardless of children", () => {
      // Set up
      const control = new TestParentControl({
        validators: [() => ({ error: "invalid" })],
      });
      const first = control.getControl([0]);
      const second = control.getControl([1]);
      expect(first.getIsValid()).toEqual(true);
      expect(second.getIsValid()).toEqual(true);

      // Act
      const error = control.validateSync();
      control.setErrors(error);

      // Assert
      expect(control.getIsValid()).toEqual(false);
    });

    test("getIsValid returns true if all children and itself are valid", () => {
      // Set up
      const control = new TestParentControl();
      expect(control.getControl([0]).getIsValid()).toBe(true);
      expect(control.getControl([1]).getIsValid()).toBe(true);

      // Assert
      expect(control.getIsValid()).toBe(true);
    });
  });

  describe("getIsPending", () => {
    it("returns false if all children and itself are not pending", () => {
      // Set up
      const control = new TestParentControl();
      expect(control.getControl([0]).getIsPending()).toBe(false);
      expect(control.getControl([1]).getIsPending()).toBe(false);

      // Assert
      expect(control.getIsPending()).toBe(false);
    });

    it("returns true if a child is pending, then returns false when done", () => {
      // Set up
      const control = new TestParentControl();
      const first = control.getControl([0])!;
      first.addAsyncValidator(requiredAsyncValidator);
      // Assert
      const firstPromise = first
        .validateAsync()
        .finally(() => {
          expect(first.getIsPending()).toBe(false);
          expect(control.getIsPending()).toBe(false);
        });
      expect(first.getIsPending()).toBe(true);
      expect(control.getIsPending()).toBe(true);
      return firstPromise;
    });

    it("returns true if any child is pending, then returns false when done", () => {
      // Set up
      const control = new TestParentControl();
      const first = control.getControl([0])!;
      const second = control.getControl([1])!;
      first.addAsyncValidator(makeRequiredAsyncValidator(200));
      second.addAsyncValidator(makeRequiredAsyncValidator(300));
      // Assert
      const firstPromise = first
        .validateAsync()
        .catch(() => {})
        .finally(() => {
          expect(first.getIsPending()).toBe(false);
          expect(control.getIsPending()).toBe(true); // still pending on second child
        });
      const secondPromise = second
        .validateAsync()
        .catch(() => {})
        .finally(() => {
          expect(first.getIsPending()).toBe(false);
          expect(control.getIsPending()).toBe(false);
        });

      expect(first.getIsPending()).toBe(true);
      expect(second.getIsPending()).toBe(true);
      expect(control.getIsPending()).toBe(true);

      return Promise.all([firstPromise, secondPromise]);
    });

    it("returns true if itself is pending", () => {
      // Set up
      const control = new TestParentControl();
      control.addAsyncValidator(async () => {
        return await new Promise((resolve) => setTimeout(() => resolve(null), 100));
      });
      // Assert
      const promise = control.validateAsync().finally(() => {
        expect(control.getIsPending()).toBe(false);
      });
      expect(control.getIsPending()).toBe(true);
      return promise;
    });
  });

  describe("setIsTouched & getIsTouched", () => {
    test("getIsTouched returns true if any child is touched", () => {
      // Set up
      const control = new TestParentControl();
      const value1 = control.getControl([0])!;
      expect(control.getIsTouched()).toBe(false);
      expect(value1.getIsTouched()).toBe(false);
      // Act
      value1.setIsTouched(true);
      // Assert
      expect(control.getIsTouched()).toBe(true);
    });

    test("setIsTouched turns true if itself is touched", () => {
      // Set up
      const control = new TestParentControl();
      expect(control.getIsTouched()).toBe(false);
      // Act
      control.setIsTouched(true);
      // Assert
      expect(control.getIsTouched()).toBe(true);
    });

    test("setIsTouched notifyStateObservers of the group, children, and parent", () => {
      // Set up
      const control = new TestParentControl();
      const parent = new GroupControl({
        group: control,
      });
      const value1 = control.getControl([0])!;
      const itemStateObserver = vi.fn();
      const groupStateObserver = vi.fn();
      const parentStateObserver = vi.fn();
      control.subscribeState(groupStateObserver);
      value1.subscribeState(itemStateObserver);
      parent.subscribeState(parentStateObserver);
      // Act
      control.setIsTouched(true);
      // Assert
      const expectedState = expect.objectContaining({
        isTouched: true,
      } as Partial<ControlState>);
      expect(itemStateObserver).toHaveBeenCalledExactlyOnceWith(expectedState);
      expect(groupStateObserver).toHaveBeenCalledExactlyOnceWith(expectedState);
      expect(parentStateObserver).toHaveBeenCalledExactlyOnceWith(expectedState);
    });
  });

  test("resetValue", () => {
    // Set up
    const control = new TestParentControl();
    const value1 = control.getControl([0])!;
    const initialValue = control.getValue();
    const observer = vi.fn();
    control.subscribeValue(observer);
    // Act
    value1.setValue("test");
    expect(control.getValue()).not.toEqual(initialValue);
    control.resetValue();
    // Assert
    expect(control.getValue()).toEqual(initialValue);
    expect(observer).toHaveBeenCalledExactlyOnceWith(initialValue);
  });

  // test("reset", () => {
  //   // Set up
  //   const INVALID_VALUE = "test";
  //   const ERRORS = { value1: "invalid" };
  //   const control = new TestParentControl();
  //   const value1 = control.getControl([0])!;
  //   const initialValue = control.getValue();
  //   const observer = vi.fn();
  //   const stateObserver = vi.fn();
  //   control.addValidator((ctrl) => {
  //     const [value1] = ctrl.getValue();
  //     return value1 === INVALID_VALUE ? ERRORS : null;
  //   });
  //   control.subscribe(observer);
  //   control.subscribeState(stateObserver);
  //   // Act
  //   value1.setValue(INVALID_VALUE);
  //   value1.validate({ isBubbling: true });
  //   expect(control.getValue()).not.toEqual(initialValue);
  //   expect(control.getState()).toEqual<ControlState>({
  //     isValid: false,
  //     isPending: false,
  //     isTouched: true,
  //     isError: true,
  //     errors: ERRORS,
  //   });
  //   control.reset();
  //   // Assert
  //   expect(control.getValue()).toEqual(initialValue);
  // });
});
