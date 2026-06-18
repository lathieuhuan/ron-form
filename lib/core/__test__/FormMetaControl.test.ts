import { describe, expect, it, vi } from "vitest";
import { FormMetaControl } from "../FormMetaControl";
import { DEFAULT_META } from "../constants";

describe("FormMetaControl", () => {
  describe("constructor", () => {
    it("initializes meta as untouched, clean, and not validating by default", () => {
      const metaControl = new FormMetaControl();

      expect(metaControl.get()).toEqual({
        ...DEFAULT_META,
        submitCount: 0,
      });
    });

    it("accepts partial initial meta values", () => {
      const metaControl = new FormMetaControl({
        isTouched: true,
        isValidating: true,
      });

      expect(metaControl.get()).toEqual({
        ...DEFAULT_META,
        isTouched: true,
        isValidating: true,
        submitCount: 0,
      });
    });
  });

  describe("get", () => {
    it("returns the current meta state", () => {
      const metaControl = new FormMetaControl({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
        submitCount: 0,
      });

      expect(metaControl.get()).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
        submitCount: 0,
      });
    });
  });

  describe("set", () => {
    it("updates meta with partial value changes", () => {
      const metaControl = new FormMetaControl();

      metaControl.set({ isTouched: true });

      expect(metaControl.get()).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: false,
        isValidating: false,
        submitCount: 0,
      });
    });

    it("updates meta with partial function changes", () => {
      const metaControl = new FormMetaControl();

      metaControl.set((meta) => ({
        isTouched: true,
        submitCount: meta.submitCount + 1,
      }));

      expect(metaControl.get()).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: false,
        isValidating: false,
        submitCount: 1,
      });
    });

    it("merges changes with existing meta", () => {
      const metaControl = new FormMetaControl({ isTouched: true });

      metaControl.set({ isDirty: true });

      expect(metaControl.get()).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
        submitCount: 0,
      });
    });

    it("does not notify subscribers when values are unchanged", () => {
      const metaControl = new FormMetaControl();
      const subscriber = vi.fn();

      metaControl.subscribe(subscriber);
      metaControl.set({ isTouched: false });

      expect(subscriber).not.toHaveBeenCalled();
    });

    it("does not notify subscribers when setting the same values", () => {
      const metaControl = new FormMetaControl({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
      const subscriber = vi.fn();

      metaControl.subscribe(subscriber);
      metaControl.set({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("subscribe", () => {
    it("notifies subscribers when meta changes", () => {
      const metaControl = new FormMetaControl();
      const subscriber = vi.fn();

      metaControl.subscribe(subscriber);
      metaControl.set({ isValidating: true });

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: true,
        submitCount: 0,
      });
    });

    it("stops notifying after unsubscribe", () => {
      const metaControl = new FormMetaControl();
      const subscriber = vi.fn();

      const unsubscribe = metaControl.subscribe(subscriber);
      unsubscribe();
      metaControl.set({ isTouched: true });

      expect(subscriber).not.toHaveBeenCalled();
    });

    it("notifies multiple subscribers", () => {
      const metaControl = new FormMetaControl();
      const firstSubscriber = vi.fn();
      const secondSubscriber = vi.fn();

      metaControl.subscribe(firstSubscriber);
      metaControl.subscribe(secondSubscriber);
      metaControl.set({ isDirty: true });

      expect(firstSubscriber).toHaveBeenCalledOnce();
      expect(secondSubscriber).toHaveBeenCalledOnce();
      expect(firstSubscriber).toHaveBeenCalledWith({
        isBlurred: false,
        isTouched: false,
        isDirty: true,
        isValidating: false,
        submitCount: 0,
      });
      expect(secondSubscriber).toHaveBeenCalledWith({
        isBlurred: false,
        isTouched: false,
        isDirty: true,
        isValidating: false,
        submitCount: 0,
      });
    });
  });
});
