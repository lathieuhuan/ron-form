import { describe, expect, it, vi } from "vitest";
import { FormControl } from "../FormControl";

const defaultValues = {
  name: "John",
  email: "john@example.com",
  profile: {
    age: 30,
  },
};

describe("FormControl", () => {
  describe("constructor", () => {
    it("initializes with cloned default values", () => {
      const form = new FormControl({ defaultValues });

      expect(form.values).toEqual(defaultValues);
      expect(form.values).not.toBe(defaultValues);
      expect(form.values.profile).not.toBe(defaultValues.profile);
    });

    it("initializes with an empty object when default values are omitted", () => {
      const form = new FormControl();

      expect(form.values).toEqual({});
    });

    it("initializes form meta as untouched, clean, and not validating", () => {
      const form = new FormControl({ defaultValues });

      expect(form.meta.get()).toEqual({
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
    });

    it("uses the provided async debounce delay", () => {
      const form = new FormControl({ defaultValues, asyncDebounceMs: 500 });

      expect(form.asyncDebounceMs).toBe(500);
    });

    it("defaults async debounce to 300ms", () => {
      const form = new FormControl({ defaultValues });

      expect(form.asyncDebounceMs).toBe(300);
    });
  });

  describe("setFieldValue", () => {
    it("updates the field value", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(form.getFieldValue("name")).toBe("Jane");
      expect(form.values.name).toBe("Jane");
    });

    it("returns false and logs an error when the field path cannot be set", () => {
      const form = new FormControl({ defaultValues });
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = form.setFieldValue("profile.age.name" as "name", "invalid" as never, {
        dontValidate: true,
      });

      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalledWith("Field profile.age.name not found in values");
    });

    it("marks the field as touched and dirty by default", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(form.getFieldMeta("name")).toEqual({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    it("respects dontTouch and dontDirty options", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldMeta("name", {
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });

      form.setFieldValue("name", "Jane", {
        dontTouch: true,
        dontDirty: true,
        dontValidate: true,
      });

      expect(form.getFieldMeta("name")).toEqual({
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
    });

    it("returns true when dontValidate is enabled", () => {
      const form = new FormControl({ defaultValues });

      const result = form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(result).toBe(true);
    });

    it("runs change validators and stores sync errors", () => {
      const validator = vi.fn(() => "Name is required");
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: validator,
        },
      });

      form.setFieldValue("name", "");

      expect(validator).toHaveBeenCalledWith({ value: "" });
      expect(form.getFieldErrorMap("name").change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Name is required",
          meta: {},
        },
      ]);
    });

    it("skips async validation when sync validation fails", () => {
      const asyncValidator = vi.fn(async () => "Async error");
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Sync error",
        },
        changeAsyncValidators: {
          name: asyncValidator,
        },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("name", "Jane");

      expect(asyncValidator).not.toHaveBeenCalled();
    });

    it("updates form meta when dontValidate is enabled", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(form.meta.get()).toEqual({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    it("aggregates form meta across multiple fields when dontValidate is enabled", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("name", "Jane", { dontValidate: true, dontDirty: true });
      form.setFieldValue("email", "jane@example.com", { dontValidate: true, dontTouch: true });

      expect(form.meta.get()).toEqual({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    it("updates form meta after sync validation", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is required",
        },
      });

      form.setFieldValue("name", "");

      expect(form.meta.get()).toEqual({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    it("notifies meta subscribers after sync validation", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is required",
        },
      });
      const subscriber = vi.fn();

      form.meta.subscribe(subscriber);
      form.setFieldValue("name", "");

      expect(subscriber).toHaveBeenCalledWith({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });
  });

  describe("setFieldMeta", () => {
    it("updates field meta with a value updater", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldMeta("name", {
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });

      expect(form.getFieldMeta("name")).toEqual({
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });
    });

    it("updates field meta with a function updater", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldMeta("name", (current) => ({
        ...current,
        isTouched: true,
      }));

      expect(form.getFieldMeta("name").isTouched).toBe(true);
    });

    it("calls updateMeta", () => {
      const form = new FormControl({ defaultValues });
      const updateMeta = vi.spyOn(form, "updateMeta");

      form.setFieldMeta("name", {
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });

      expect(updateMeta).toHaveBeenCalledOnce();
    });
  });
});
