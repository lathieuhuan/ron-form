import {
  ASYNC_ERROR,
  REQUIRED_ERROR,
  requiredAsyncValidator,
  requiredValidator,
} from "@lib/core/test-utils/validation-utils";
import { describe, expect, it, test, vi } from "vitest";
import { TestBaseControl } from "./TestBaseControl";

describe("BaseControl", () => {
  const VALID_VALUE = "xxx";

  test("addValidator & removeValidator", () => {
    // Set up
    const control = new TestBaseControl<string | undefined>();
    // Act
    control.addValidator(requiredValidator);
    // Assert
    expect(control._validator.validators).toContain(requiredValidator);
    // Act
    control.removeValidator(requiredValidator);
    // Assert
    expect(control._validator.validators).not.toContain(requiredValidator);
  });

  test("addAsyncValidator & removeAsyncValidator", () => {
    // Set up
    const control = new TestBaseControl<string | undefined>();
    // Act
    control.addAsyncValidator(requiredAsyncValidator);
    // Assert
    expect(control._asyncValidator.validators).toContain(requiredAsyncValidator);
    // Act
    control.removeAsyncValidator(requiredAsyncValidator);
    // Assert
    expect(control._asyncValidator.validators).not.toContain(requiredAsyncValidator);
  });

  describe("validate", () => {
    it("updates errors", () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        validators: [requiredValidator],
      });
      // Act
      control.validate();
      // Assert
      expect(control.getErrors()).toEqual(REQUIRED_ERROR);

      control.setValue(VALID_VALUE);
      control.validate();
      expect(control.getErrors()).toEqual(null);
    });

    it("when invalid, returns errors and calls onError", () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        validators: [requiredValidator],
      });
      const onError = vi.fn();
      control.setValue(undefined);
      // Act
      const errors = control.validate({ onError });
      // Assert
      expect(errors).toEqual(REQUIRED_ERROR);
      expect(onError).toHaveBeenCalledWith(REQUIRED_ERROR);
    });

    it("when valid, returns null and does not call onError", () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        validators: [requiredValidator],
      });
      const onError = vi.fn();
      control.setValue(VALID_VALUE);
      // Act
      const errors = control.validate({ onError });
      // Assert
      expect(errors).toEqual(null);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("validateAsync", () => {
    it("changes isPending to true, then to false and updates errors when settled", async () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        asyncValidators: [requiredAsyncValidator],
      });

      // From no errors to errors
      const promise = control.validateAsync();

      expect(control.getIsPending()).toBe(true);
      expect(control.getErrors()).toEqual(null);

      await promise;

      expect(control.getIsPending()).toBe(false);
      expect(control.getErrors()).toEqual(ASYNC_ERROR);

      // From errors to no errors
      control.setValue(VALID_VALUE);

      await control.validateAsync();

      expect(control.getIsPending()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    it("when settled & invalid, returns errors and calls onError", async () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        asyncValidators: [requiredAsyncValidator],
      });
      const onError = vi.fn();
      control.setValue(undefined);
      // Act
      await control.validateAsync({ onError });
      // Assert
      expect(onError).toHaveBeenCalledWith(ASYNC_ERROR);
    });

    it("when settled & valid, returns null and does not call onError", async () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        asyncValidators: [requiredAsyncValidator],
      });
      const onError = vi.fn();
      control.setValue(VALID_VALUE);
      // Act
      const errors = await control.validateAsync({ onError });
      // Assert
      expect(errors).toEqual(null);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  test("when notifyValueObservers, value observers are notified with result of getValue", () => {
    // Set up
    const control = new TestBaseControl();
    const observer = vi.fn();
    control.subscribeValue(observer);
    // Act
    control.notifyValueObservers();
    // Assert
    expect(observer).toHaveBeenCalledWith(control.getValue());
  });

  test("when notifyStateObservers, state observers are notified with result of getState", () => {
    // Set up
    const control = new TestBaseControl();
    const observer = vi.fn();
    control.subscribeState(observer);
    // Act
    control.notifyStateObservers();
    // Assert
    expect(observer).toHaveBeenCalledWith(control.getState());
  });
});
