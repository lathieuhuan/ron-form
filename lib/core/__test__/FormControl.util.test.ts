import { describe, expect, it, vi } from "vitest";
import { FormControl } from "../FormControl";

const defaultValues = {
  name: "John",
  email: "john@example.com",
  profile: {
    age: 30,
  },
};

describe("FormControl utilities", () => {
  describe("subscribeField", () => {
    it("notifies subscribers when field state changes", () => {
      const form = new FormControl({ defaultValues });
      const subscriber = vi.fn();

      form.subscribeField("name", subscriber);
      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: "Jane",
        meta: {
          isTouched: true,
          isDirty: true,
          isValidating: false,
        },
        errorMap: {
          change: [],
          blur: [],
          changeAsync: [],
          blurAsync: [],
        },
      });
    });

    it("stops notifying after unsubscribe", () => {
      const form = new FormControl({ defaultValues });
      const subscriber = vi.fn();

      const unsubscribe = form.subscribeField("name", subscriber);
      unsubscribe();
      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("updateAndNotifyField", () => {
    it("merges partial state with current field value, meta, and errors", () => {
      const form = new FormControl({ defaultValues });
      const subscriber = vi.fn();

      form.subscribeField("name", subscriber);
      form.updateAndNotifyField("name", {
        meta: {
          isTouched: true,
          isDirty: false,
          isValidating: false,
        },
      });

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: "John",
        meta: {
          isTouched: true,
          isDirty: false,
          isValidating: false,
        },
        errorMap: {
          change: [],
          blur: [],
          changeAsync: [],
          blurAsync: [],
        },
      });
      expect(form.getFieldMeta("name")).toEqual({
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });
    });

    it("persists error map changes to the field error map", () => {
      const form = new FormControl({ defaultValues });
      const errorMap = {
        change: [
          {
            path: "name" as const,
            type: "change" as const,
            message: "Name is required",
            meta: {},
          },
        ],
        blur: [],
        changeAsync: [],
        blurAsync: [],
      };

      form.updateAndNotifyField("name", { errorMap });

      expect(form.getFieldErrorMap("name")).toEqual(errorMap);
    });

    it("does not notify form meta", () => {
      const form = new FormControl({ defaultValues });
      const metaSubscriber = vi.fn();

      form.meta.subscribe(metaSubscriber);
      form.updateAndNotifyField("name", {
        meta: {
          isTouched: true,
          isDirty: true,
          isValidating: false,
        },
      });

      expect(metaSubscriber).not.toHaveBeenCalledOnce();
    });
  });

  describe("syncMeta", () => {
    it("keeps form meta false when no field meta exists", () => {
      const form = new FormControl({ defaultValues });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
    });

    it("aggregates isTouched from any field", () => {
      const form = new FormControl({ defaultValues });

      form.fieldMetaMap.set("name", {
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });
      form.fieldMetaMap.set("email", {
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });
    });

    it("aggregates isDirty from any field", () => {
      const form = new FormControl({ defaultValues });

      form.fieldMetaMap.set("name", {
        isTouched: false,
        isDirty: true,
        isValidating: false,
      });
      form.fieldMetaMap.set("email", {
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isTouched: false,
        isDirty: true,
        isValidating: false,
      });
    });

    it("aggregates isValidating from any field", () => {
      const form = new FormControl({ defaultValues });

      form.fieldMetaMap.set("name", {
        isTouched: false,
        isDirty: false,
        isValidating: true,
      });
      form.fieldMetaMap.set("email", {
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isTouched: false,
        isDirty: false,
        isValidating: true,
      });
    });

    it("aggregates all flags across multiple fields", () => {
      const form = new FormControl({ defaultValues });

      form.fieldMetaMap.set("name", {
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });
      form.fieldMetaMap.set("email", {
        isTouched: false,
        isDirty: true,
        isValidating: false,
      });
      form.fieldMetaMap.set("profile.age", {
        isTouched: false,
        isDirty: false,
        isValidating: true,
      });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isTouched: true,
        isDirty: true,
        isValidating: true,
      });
    });

    it("resets aggregated flags when all field meta is clean", () => {
      const form = new FormControl({ defaultValues });

      form.fieldMetaMap.set("name", {
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
      form.syncMeta();

      form.fieldMetaMap.set("name", {
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
    });

    it("notifies meta subscribers", () => {
      const form = new FormControl({ defaultValues });
      const subscriber = vi.fn();

      form.meta.subscribe(subscriber);
      form.fieldMetaMap.set("name", {
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });

      form.syncMeta();

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });
  });
});
