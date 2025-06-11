import { describe, expect, it, test, vi } from "vitest";
import { TestParentControl } from "./test_parent_control";
import {
  requiredAsyncValidator,
  makeRequiredAsyncValidator,
  requiredValidator,
} from "@lib/__tests__/test_utils";
import { GroupControl } from "@lib/core/group_control";
import { ControlState } from "@lib/core/types";

describe("ParentControl", () => {
  describe("getIsValid", () => {
    it("returns true if all children and itself are valid", () => {
      const control = new TestParentControl();
      expect(control.getIsValid()).toBe(true);
    });

    it("returns false if any child is invalid", () => {
      // Set up
      const control = new TestParentControl();
      const first = control.getControl([0])!;
      // Act
      first.addValidator(requiredValidator);
      first.validateSync();
      // Assert
      expect(first.getIsValid()).toBe(false);
      expect(control.getIsValid()).toBe(false);
    });

    it("returns false if itself is invalid", () => {
      // Set up
      const control = new TestParentControl();
      control.addValidator((control) => {
        return control.getValue().filter(Boolean).length
          ? null
          : { atleast1: "Require atleast 1 valid value" };
      });
      // Act
      control.validateSync();
      // Assert
      expect(control.getIsValid()).toBe(false);
    });
  });

  describe("getIsPending", () => {
    it("returns false if no child and itself are not pending", () => {
      const control = new TestParentControl();
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
        .catch(() => {})
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
    control.subscribe(observer);
    // Act
    value1.setValue("test");
    expect(control.getValue()).not.toEqual(initialValue);
    control.resetValue();
    // Assert
    expect(control.getValue()).toEqual(initialValue);
    expect(observer).toHaveBeenCalledExactlyOnceWith(initialValue);
  });

  test("reset", () => {
    // Set up
    const INVALID_VALUE = "test";
    const ERRORS = { value1: "invalid" };
    const control = new TestParentControl();
    const value1 = control.getControl([0])!;
    const initialValue = control.getValue();
    const observer = vi.fn();
    const stateObserver = vi.fn();
    control.addValidator((ctrl) => {
      const [value1] = ctrl.getValue();
      return value1 === INVALID_VALUE ? ERRORS : null;
    });
    control.subscribe(observer);
    control.subscribeState(stateObserver);
    // Act
    value1.setValue(INVALID_VALUE);
    value1.validate({ isBubbling: true });
    expect(control.getValue()).not.toEqual(initialValue);
    expect(control.getState()).toEqual<ControlState>({
      isValid: false,
      isPending: false,
      isTouched: true,
      isError: true,
      errors: ERRORS,
    });
    control.reset();
    // Assert
    expect(control.getValue()).toEqual(initialValue);
    // expect(observer).toHaveBeenCalledExactlyOnceWith(initialValue);
    expect(observer).toHaveBeenCalledTimes(4);
    expect(observer).toHaveBeenLastCalledWith(initialValue);
    // expect(stateObserver).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
    //   isValid: true,
    //   isPending: false,
    //   isTouched: false,
    //   isError: false,
    //   errors: null,
    // }));
  });

  test("debug", () => {
    const control = new TestParentControl();
    control.subscribe((value) => {
      console.log("observer", value);
    });
    control.reset();
  });
});
