import {
  ASYNC_ERROR,
  REQUIRED_ERROR,
  requiredAsyncValidator,
  requiredValidator,
} from "@lib/core/test/test_utils";
import { describe, expect, it, test, vi } from "vitest";
import { TestBaseControl } from "./TestBaseControl";

describe("BaseControl", () => {
  test("value observers are notified with result of getValue when notifyValueObservers", () => {
    // Set up
    const control = new TestBaseControl();
    const observer = vi.fn();
    control.subscribeValue(observer);
    // Act
    control.notifyValueObservers();
    // Assert
    expect(observer).toHaveBeenCalledWith(control.getValue());
  });

  test("state observers are notified with result of getState when notifyStateObservers", () => {
    // Set up
    const control = new TestBaseControl();
    const observer = vi.fn();
    control.subscribeState(observer);
    // Act
    control.notifyStateObservers();
    // Assert
    expect(observer).toHaveBeenCalledWith(control.getState());
  });

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

  describe("validateSync", () => {
    it("when invalid, returns errors and calls onError", () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        validators: [requiredValidator],
      });
      const onError = vi.fn();
      control.setValue(undefined);
      // Act
      const errors = control.validateSync({ onError });
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
      control.setValue("test");
      // Act
      const errors = control.validateSync({ onError });
      // Assert
      expect(errors).toEqual(null);
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe("validateAsync", () => {
    it("when settled & invalid, returns errors and calls onError", async () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        asyncValidators: [requiredAsyncValidator],
      });
      const onError = vi.fn();
      control.setValue(undefined);
      // Act
      await control.validateAsync({ onError }).catch((error) => {
        expect(error).toEqual(ASYNC_ERROR);
      });
      // Assert
      expect(onError).toHaveBeenCalledWith(ASYNC_ERROR);
    });

    it("when settled & valid, returns null and does not call onError", async () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        asyncValidators: [requiredAsyncValidator],
      });
      const onError = vi.fn();
      control.setValue("test");
      // Act
      const errors = await control.validateAsync({ onError });
      // Assert
      expect(errors).toEqual(null);
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
