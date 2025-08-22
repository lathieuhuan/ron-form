import {
  REQUIRED_ERROR,
  requiredAsyncValidator,
  requiredValidator,
} from "@lib/core/test-utils/validation-utils";
import { describe, expect, it, test, vi } from "vitest";
import { TestParentControl } from "./TestParentControl";

describe("ParentControl", () => {
  describe("getIsValid", () => {
    it("returns false if parent is invalid, regardless of children", () => {
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

    it("returns false if any child is invalid", () => {
      // Set up
      const control = new TestParentControl();
      const first = control.getControl([0]);
      const second = control.getControl([1]);
      first.addValidator(requiredValidator);
      expect(control.getIsValid()).toBe(true);

      // Act
      first.validateSync();
      expect(first.getIsValid()).toEqual(false);
      expect(second.getIsValid()).toEqual(true);

      // Assert
      expect(control.getIsValid()).toEqual(false);
    });

    it("returns true if parent and all children are valid", () => {
      // Set up
      const control = new TestParentControl();
      expect(control.getControl([0]).getIsValid()).toBe(true);
      expect(control.getControl([1]).getIsValid()).toBe(true);

      // Assert
      expect(control.getIsValid()).toBe(true);
    });
  });

  describe("getIsPending", () => {
    it("returns true if parent is pending validateAsync, then returns false when it settles", async () => {
      // Set up
      const control = new TestParentControl({
        asyncValidators: [requiredAsyncValidator],
      });

      // From true to false
      // Act
      control.validateAsync();

      // Assert
      expect(control.getIsPending()).toBe(true);
      await control.validateAsync();
      expect(control.getIsPending()).toBe(false);
    });

    it("returns true if a child is pending validateAsync, then returns false when it settles", async () => {
      // Set up
      const control = new TestParentControl();
      const first = control.getControl([0])!;
      first.addAsyncValidator(requiredAsyncValidator);

      // Act
      first.validateAsync();
      // Assert
      expect(first.getIsPending()).toBe(true);
      expect(control.getIsPending()).toBe(true);

      await first.validateAsync();
      // Assert
      expect(first.getIsPending()).toBe(false);
      expect(control.getIsPending()).toBe(false);
    });

    it("returns false if parent and all children are not pending validateAsync", () => {
      // Set up
      const control = new TestParentControl();
      expect(control.getControl([0]).getIsPending()).toBe(false);
      expect(control.getControl([1]).getIsPending()).toBe(false);

      // Assert
      expect(control.getIsPending()).toBe(false);
    });
  });

  describe("getIsTouched", () => {
    it("returns true if parent is touched", () => {
      // Set up
      const control = new TestParentControl();
      expect(control.getIsTouched()).toBe(false);
      // Act
      control.setIsTouched(true);
      // Assert
      expect(control.getIsTouched()).toBe(true);
    });

    it("returns true if any child is touched", () => {
      // Set up
      const control = new TestParentControl();
      const first = control.getControl([0]);
      expect(control.getIsTouched()).toBe(false);
      expect(first.getIsTouched()).toBe(false);

      // Act
      first.setIsTouched(true);

      // Assert
      expect(control.getIsTouched()).toBe(true);
      expect(first.getIsTouched()).toBe(true);
    });

    it("returns false if all children and itself are not touched", () => {
      // Set up
      const control = new TestParentControl();
      expect(control.getIsTouched()).toBe(false);
      // Assert
      expect(control.getIsTouched()).toBe(false);
    });
  });

  test("setIsTouched changes all children to touched", () => {
    // Set up
    const control = new TestParentControl();
    const first = control.getControl([0]);
    const second = control.getControl([1]);
    expect(control.getIsTouched()).toBe(false);
    // Act
    control.setIsTouched(true);
    // Assert
    expect(first.getIsTouched()).toBe(true);
    expect(second.getIsTouched()).toBe(true);
  });

  test("resetValue resets all children's values, runs validateSync on parent once, and notify parent's value & state observers once", () => {
    // Set up
    const control = new TestParentControl();
    const first = control.getControl([0])!;
    const second = control.getControl([1])!;
    first.setValue("test");
    second.setValue("test");

    const validatorObserver = vi.fn();
    const valueObserver = vi.fn();
    const stateObserver = vi.fn();
    control.addValidator(() => {
      validatorObserver();
      return null;
    });
    control.subscribeValue(valueObserver);
    control.subscribeState(stateObserver);

    // Act
    control.resetValue();

    // Assert
    expect(first.getValue()).toEqual(undefined);
    expect(second.getValue()).toEqual(undefined);
    expect(validatorObserver).toHaveBeenCalledOnce();
    expect(valueObserver).toHaveBeenCalledOnce();
    expect(valueObserver).toHaveBeenCalledWith([undefined, undefined]);
    expect(stateObserver).toHaveBeenCalledOnce();
    expect(stateObserver).toHaveBeenCalledWith(control.getState());
  });

  test("resetState resets parent's and all children's state", () => {
    // Set up
    const control = new TestParentControl();
    const first = control.getControl([0])!;
    const second = control.getControl([1])!;
    first.setIsTouched(true);
    second.setIsTouched(true);
    control.setErrors(REQUIRED_ERROR);
    first.setErrors(REQUIRED_ERROR);
    second.setErrors(REQUIRED_ERROR);

    // Before state reset
    expect(first.getIsTouched()).toBe(true);
    expect(second.getIsTouched()).toBe(true);
    expect(control.getErrors()).toEqual(REQUIRED_ERROR);
    expect(first.getErrors()).toEqual(REQUIRED_ERROR);
    expect(second.getErrors()).toEqual(REQUIRED_ERROR);

    // Act
    control.resetState();

    // After state reset
    expect(first.getIsTouched()).toBe(false);
    expect(second.getIsTouched()).toBe(false);
    expect(control.getErrors()).toEqual(null);
    expect(first.getErrors()).toEqual(null);
    expect(second.getErrors()).toEqual(null);
  });

  // other methods are tested in GroupControl & ListControl tests

  // test("signalChange runs validateSync on parent when child ItemControl changes value", () => {
  //   // Set up
  //   const control = new TestParentControl();
  //   control.addValidator((c) => {
  //     return c.getValue()[0] ? null : { error: "error" };
  //   });
  //   const first = control.getControl([0])!;

  //   // Act
  //   first.setValue("value");

  //   // Assert
  //   expect(control.getErrors()).toEqual(null);

  //   // Act
  //   first.setValue(undefined);

  //   // Assert
  //   expect(control.getErrors()).toEqual({ error: "error" });
  // });
});
