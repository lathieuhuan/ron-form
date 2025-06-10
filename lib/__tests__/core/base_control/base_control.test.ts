import { ValidateOptions } from "@lib/core/types";
import { describe, expect, it, test, vi } from "vitest";
import {
  ASYNC_ERROR,
  asyncValidator,
  REQUIRED_ERROR,
  requiredValidator,
} from "@lib/__tests__/test_utils";
import { TestBaseControl } from "./test_base_control";

describe("BaseControl", () => {
  test("observers are notified with result of getValue when notifyObservers", () => {
    // Set up
    const control = new TestBaseControl();
    const observer = vi.fn();
    control.subscribe(observer);
    // Act
    control.notifyObservers();
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
    const control = new TestBaseControl<string | null>();
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
    const control = new TestBaseControl<string | null>();
    // Act
    control.addAsyncValidator(asyncValidator);
    // Assert
    expect(control._asyncValidator.validators).toContain(asyncValidator);
    // Act
    control.removeAsyncValidator(asyncValidator);
    // Assert
    expect(control._asyncValidator.validators).not.toContain(asyncValidator);
  });

  describe("validateSync", () => {
    it("runs validators, updates errors & isValid, calls handleValidateResult, returns errors", () => {
      // Set up
      const control = new TestBaseControl<string | null>({
        validators: [requiredValidator],
      });
      control.setValue(null);
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
      const control = new TestBaseControl<string | null>({
        validators: [requiredValidator],
      });
      control.setValue(null);
      const onError = vi.fn();
      // Act
      control.validateSync({ onError });
      // Assert
      expect(onError).toHaveBeenCalledWith(REQUIRED_ERROR);
    });

    it("passes options to handleValidateResult", () => {
      // Set up
      const control = new TestBaseControl<string | null>({
        validators: [requiredValidator],
      });
      const options: ValidateOptions = {
        shouldTouch: false,
        isBubbling: true,
        isMuted: true,
        onError: () => {},
      };
      control.setValue(null);
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
      const control = new TestBaseControl<string | null>({
        asyncValidators: [asyncValidator],
      });
      control.setValue(null);
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
      const control = new TestBaseControl<string | null>({
        asyncValidators: [asyncValidator],
      });
      const onError = vi.fn();
      control.setValue(null);
      // Act
      await control.validateAsync({ onError }).catch((error) => {
        expect(error).toEqual(ASYNC_ERROR);
      });
      // Assert
      expect(onError).toHaveBeenCalledWith(ASYNC_ERROR);
    });

    it("passes options to handleValidateResult", async () => {
      // Set up
      const control = new TestBaseControl<string | null>({
        asyncValidators: [asyncValidator],
      });
      const options: ValidateOptions = {
        shouldTouch: false,
        isBubbling: true,
        isMuted: true,
        onError: () => {},
      };
      control.setValue(null);
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
    control.setValue(null);
    // Act
    control._resetState();
    // Assert
    expect(control.getIsValid()).toBe(false);
    expect(control.errors).toEqual(REQUIRED_ERROR);
    expect(control.getIsPending()).toBe(false);
  });
});
