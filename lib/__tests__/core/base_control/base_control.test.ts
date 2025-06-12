import {
  ASYNC_ERROR,
  REQUIRED_ERROR,
  requiredAsyncValidator,
  requiredValidator,
} from "@lib/__tests__/test_utils";
import { ValidateOptions } from "@lib/core/types";
import { describe, expect, it, test, vi } from "vitest";
import { TestBaseControl } from "./test_base_control";

describe("BaseControl", () => {
  test("observers are notified with result of getValue when notifyValueObservers", () => {
    // Set up
    const control = new TestBaseControl();
    const observer = vi.fn();
    control.subscribe(observer);
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
    it("runs validators, updates errors & isValid, calls handleValidateResult, returns errors", () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        validators: [requiredValidator],
      });
      control.setValue(undefined);
      control.handleValidateResult = vi.fn();
      // Act
      const errors = control.validateSync();
      // Assert
      expect(errors).toEqual(REQUIRED_ERROR);
      expect(control.getIsValid()).toBe(false);
      expect(control.handleValidateResult).toHaveBeenCalled();
    });

    it("calls onError on error", () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        validators: [requiredValidator],
      });
      control.setValue(undefined);
      const onError = vi.fn();
      // Act
      control.validateSync({ onError });
      // Assert
      expect(onError).toHaveBeenCalledWith(REQUIRED_ERROR);
    });

    it("passes options to handleValidateResult", () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        validators: [requiredValidator],
      });
      const options: ValidateOptions = {
        shouldTouch: false,
        isBubbling: true,
        isMuted: true,
        onError: () => {},
      };
      control.setValue(undefined);
      control.handleValidateResult = vi.fn();
      // Act
      control.validateSync(options);
      // Assert
      expect(control.handleValidateResult).toHaveBeenCalledWith(options);
    });
  });

  describe("validateAsync", () => {
    it("runs async validators, updates errors & isValid, calls handleValidateResult, throws errors on error", async () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        asyncValidators: [requiredAsyncValidator],
      });
      control.setValue(undefined);
      control.handleValidateResult = vi.fn();
      // Act
      await control.validateAsync().catch((error) => {
        expect(error).toEqual(ASYNC_ERROR);
      });
      // Assert
      expect(control.getIsValid()).toBe(false);
      expect(control.handleValidateResult).toHaveBeenCalled();
    });

    it("calls onError on error", async () => {
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

    it("passes options to handleValidateResult", async () => {
      // Set up
      const control = new TestBaseControl<string | undefined>({
        asyncValidators: [requiredAsyncValidator],
      });
      const options: ValidateOptions = {
        shouldTouch: false,
        isBubbling: true,
        isMuted: true,
        onError: () => {},
      };
      control.setValue(undefined);
      control.handleValidateResult = vi.fn();
      // Act
      await control.validateAsync(options).catch(() => {});
      // Assert
      expect(control.handleValidateResult).toHaveBeenCalledWith(options);
    });
  });

  describe("handleValidateResult", () => {
    it("calls notifyStateObservers if isMuted false", () => {
      // Set up
      const control = new TestBaseControl();
      control.notifyStateObservers = vi.fn();
      // Act
      control.handleValidateResult({ isMuted: false });
      // Assert
      expect(control.notifyStateObservers).toHaveBeenCalled();
    });

    it("does not call notifyStateObservers if isMuted true", () => {
      // Set up
      const control = new TestBaseControl();
      control.notifyStateObservers = vi.fn();
      // Act
      control.handleValidateResult({ isMuted: true });
      // Assert
      expect(control.notifyStateObservers).not.toHaveBeenCalled();
    });
  });

  test("resetState runs validateSync and updates isPending to false", () => {
    // Set up
    const control = new TestBaseControl({
      validators: [requiredValidator],
    });
    control.setValue(undefined);
    // Act
    control._resetState();
    // Assert
    expect(control.getIsValid()).toBe(false);
    expect(control.errors).toEqual(REQUIRED_ERROR);
    expect(control.getIsPending()).toBe(false);
  });
});
