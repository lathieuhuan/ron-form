import {
  REQUIRED_ERROR,
  requiredAsyncValidator,
  requiredValidator,
} from "@lib/core/test-utils/validation-utils";
import { describe, expect, it, test, vi } from "vitest";
import { ItemControlValue, TestParentControl } from "./TestParentControl";
import { ValidatorFn } from "@lib/core/types";

const FIRST_VALUE_REQUIRED_ERROR = { error: "required first value" };

const firstValueRequired: ValidatorFn<ItemControlValue[]> = (ctrl) => {
  const firstValue = ctrl.getValue().at(0);
  return firstValue === undefined ? FIRST_VALUE_REQUIRED_ERROR : null;
};

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
      const error = control.validate();
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
      first.validate();
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

      // Act
      const result = control.validateAsync();

      // Assert
      expect(control.getIsPending()).toBe(true);
      await result;
      expect(control.getIsPending()).toBe(false);
    });

    it("returns true if a child is pending validateAsync, then returns false when it settles", async () => {
      // Set up
      const control = new TestParentControl();
      const first = control.getControl([0])!;
      first.addAsyncValidator(requiredAsyncValidator);

      // Act
      const result = first.validateAsync();

      // Assert
      expect(first.getIsPending()).toBe(true);
      expect(control.getIsPending()).toBe(true);
      await result;
      expect(first.getIsPending()).toBe(false);
      expect(control.getIsPending()).toBe(false);
    });

    it("returns false if parent and all children are not pending validateAsync", () => {
      // Set up
      const control = new TestParentControl();

      // Assert
      expect(control.getControl([0]).getIsPending()).toBe(false);
      expect(control.getControl([1]).getIsPending()).toBe(false);
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
    // TODO: test nofify state observers
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

  describe("resetValue", () => {
    it("resets all children's values, notifies their value observers, and calls onValueChange of parent", () => {
      // Set up
      const control = new TestParentControl();
      const first = control.getControl([0]);
      const second = control.getControl([1])!;
      expect(first.getValue()).toEqual(undefined);
      expect(second.getValue()).toEqual(undefined);
      first.setValue("test");
      second.setValue("test");

      const firstValueObs = vi.fn();
      const secondValueObs = vi.fn();
      first.subscribeValue(firstValueObs);
      second.subscribeValue(secondValueObs);
      const onValueChange = vi.fn();
      control["onValueChange"] = onValueChange;

      // Act
      control.resetValue();

      // Assert
      expect(first.getValue()).toEqual(undefined);
      expect(second.getValue()).toEqual(undefined);
      expect(firstValueObs).toHaveBeenCalledOnce();
      expect(secondValueObs).toHaveBeenCalledOnce();
      expect(onValueChange).toHaveBeenCalledOnce();
    });

    // Performance test
    it("by default, notify value observers of parent once", () => {
      // Set up
      const control = new TestParentControl();
      const onValueChange = vi.fn();
      control.subscribeValue(onValueChange);

      // Act
      control.resetValue();

      // Assert
      expect(onValueChange).toHaveBeenCalledOnce();
    });

    // Also test performance
    it("when validate is true, validates all children and parent, and notifies their state observers once", () => {
      // Set up
      const control = new TestParentControl({
        validators: [firstValueRequired],
      });
      const second = control.getControl([1]);
      second.addValidator(requiredValidator);

      const child2StateObs = vi.fn();
      second.subscribeState(child2StateObs);
      const stateObs = vi.fn();
      control.subscribeState(stateObs);

      // Act
      control.resetValue({ validate: true });

      // Assert
      expect(second.getErrors()).toEqual(REQUIRED_ERROR);
      expect(control.getErrors()).toEqual(FIRST_VALUE_REQUIRED_ERROR);
      expect(child2StateObs).toHaveBeenCalledOnce();
      expect(stateObs).toHaveBeenCalledOnce();
    });
  });

  test("reset calls reset on all children, and calls onValueChange on parent with validate false", () => {
    // Set up
    const control = new TestParentControl({
      validators: [firstValueRequired],
    });
    const first = control.getControl([0]);
    const second = control.getControl([1]);

    // second child before reset
    second.addValidator(requiredValidator);
    second.validate();
    expect(second.getErrors()).toEqual(REQUIRED_ERROR);
    expect(second.getIsTouched()).toBe(true);

    // parent before reset
    control.validate();
    expect(control.getErrors()).toEqual(FIRST_VALUE_REQUIRED_ERROR);
    expect(control.getIsTouched()).toBe(true);

    const child1Reset = vi.fn();
    first["reset"] = child1Reset;
    const child2Reset = vi.fn();
    second["reset"] = child2Reset;
    const onValueChange = vi.fn();
    control["onValueChange"] = onValueChange;

    // Act
    control.reset();

    // Assert
    expect(child1Reset).toHaveBeenCalledOnce();
    expect(child2Reset).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith({ validate: false });

    // after reset
    expect(control.getErrors()).toEqual(null);
    expect(control.getIsTouched()).toBe(false);
    expect(second.getErrors()).toEqual(null);
    expect(second.getIsTouched()).toBe(false);
  });

  // other methods are tested in GroupControl & ListControl tests
});
