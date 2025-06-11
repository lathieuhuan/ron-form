import { describe, expect, it, test, vi } from "vitest";
import { TestParentControl } from "./test_parent_control";
import {
  requiredAsyncValidator,
  makeRequiredAsyncValidator,
  requiredValidator,
} from "@lib/__tests__/test_utils";
import { makeValidGroup } from "../group_control/group_control.test_utils";
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
        return control.getValue().length ? null : { atleast1: "Require atleast 1" };
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

    describe("setIsToucher & getIsTouched", () => {
      test("ItemControl setIsTouched turns group touched to true", () => {
        // Set up
        const control = makeValidGroup();
        const value1 = control.getControl(["value1"]);
        expect(control.getIsTouched()).toBe(false);
        expect(value1.getIsTouched()).toBe(false);
        // Act
        value1.setIsTouched(true);
        // Assert
        expect(control.getIsTouched()).toBe(true);
      });

      test("setIsTouched turns touched to true", () => {
        // Set up
        const control = makeValidGroup();
        expect(control.getIsTouched()).toBe(false);
        // Act
        control.setIsTouched(true);
        // Assert
        expect(control.getIsTouched()).toBe(true);
      });

      test("setIsTouched notifyStateObservers of the group, children, and parent", () => {
        // Set up
        const control = makeValidGroup();
        const parent = new GroupControl({
          group: control,
        });
        const value1 = control.getControl(["value1"]);
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
  });
});
