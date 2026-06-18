import { describe, expect, it, vi } from "vitest";
import { FormControl } from "../FormControl";

const defaultValues = {
  name: "",
  email: "",
  profile: {
    age: 0,
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

    it("initializes form meta as not blurred, untouched, clean, and not validating, and submit count 0", () => {
      const form = new FormControl({ defaultValues });

      expect(form.meta.get()).toEqual({
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
        submitCount: 0,
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

      const result = form.setFieldValue("profile.age.name" as "name", "invalid" as never);

      expect(result).toBe(false);
      expect(consoleError).toHaveBeenCalled();
    });

    it("marks the field as touched and dirty by default", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(form.getFieldMeta("name")).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    it("respects dontTouch and dontDirty options", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldMeta("name", {
        isBlurred: false,
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
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
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

    it("clears change & changeAsync errors and calls syncMeta when dontValidate is enabled", async () => {
      vi.useFakeTimers();

      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: ({ value }) => (value.length < 3 ? "Sync error" : null),
        },
        changeAsyncValidators: {
          name: async ({ value }) => (value.length < 4 ? "Async error" : null),
        },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("name", "Joe");
      await vi.advanceTimersByTimeAsync(100);

      const errorMap = form.getFieldErrorMap("name");
      expect(errorMap.change).toEqual([]);
      expect(errorMap.changeAsync).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Async error",
          meta: {},
        },
      ]);

      const syncMeta = vi.spyOn(form, "syncMeta");

      form.setFieldValue("name", "Na", { dontValidate: true });
      await vi.advanceTimersByTimeAsync(100);

      const newErrorMap = form.getFieldErrorMap("name");
      expect(newErrorMap.change).toEqual([]);
      expect(newErrorMap.changeAsync).toEqual([]);
      expect(syncMeta).toHaveBeenCalledOnce();

      vi.useRealTimers();
    });

    it("notifies field subscribers", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is invalid",
        },
      });
      const subscriber = vi.fn();

      form.subscribeField("name", subscriber);
      form.setFieldValue("name", "Jane");

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          value: "Jane",
        }),
      );
    });

    it("notifies field subscribers even when dontValidate is false but there is no sync validator", () => {
      const form = new FormControl({ defaultValues });
      const subscriber = vi.fn();

      form.subscribeField("name", subscriber);
      form.setFieldValue("name", "Jane", { dontValidate: false });

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          value: "Jane",
        }),
      );
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
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
        submitCount: 0,
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
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
        submitCount: 0,
      });
    });
  });

  describe("setFieldMeta", () => {
    it("updates field meta with a value updater", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldMeta("name", {
        isBlurred: false,
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });

      expect(form.getFieldMeta("name")).toEqual({
        isBlurred: false,
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

    it("calls syncMeta", () => {
      const form = new FormControl({ defaultValues });
      const syncMeta = vi.spyOn(form, "syncMeta");

      form.setFieldMeta("name", {
        isBlurred: false,
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });

      expect(syncMeta).toHaveBeenCalledOnce();
    });
  });

  describe("handleSubmit", () => {
    it("calls onSubmit with current values when all validators pass", () => {
      const onSubmit = vi.fn();
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: ({ value }) => (value.length > 0 ? null : "Name is required"),
        },
        blurValidators: {
          email: ({ value }) => (value.includes("@") ? null : "Invalid email"),
        },
        onSubmit,
      });

      form.setFieldValue("name", "Jane", { dontValidate: true });
      form.setFieldValue("email", "jane@example.com", { dontValidate: true });

      form.handleSubmit();

      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith({
        values: {
          name: "Jane",
          email: "jane@example.com",
          profile: { age: 0 },
        },
      });
    });

    it("calls onSubmit when no validators are registered", () => {
      const onSubmit = vi.fn();
      const form = new FormControl({ defaultValues, onSubmit });

      form.handleSubmit();

      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith({ values: defaultValues });
    });

    it("does not call onSubmit when change validation fails", () => {
      const onSubmit = vi.fn();
      const onSubmitFailed = vi.fn();
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is required",
        },
        onSubmit,
        onSubmitFailed,
      });

      form.handleSubmit();

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onSubmitFailed).toHaveBeenCalledOnce();
    });

    it("does not call onSubmit when blur validation fails", () => {
      const onSubmit = vi.fn();
      const onSubmitFailed = vi.fn();
      const form = new FormControl({
        defaultValues,
        blurValidators: {
          email: () => "Email is required",
        },
        onSubmit,
        onSubmitFailed,
      });

      form.handleSubmit();

      expect(onSubmit).not.toHaveBeenCalled();
      expect(onSubmitFailed).toHaveBeenCalledOnce();
    });

    it("calls onSubmitFailed when any validator fails", () => {
      const onSubmitFailed = vi.fn();
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is required",
        },
        blurValidators: {
          email: () => "Email is required",
        },
        onSubmitFailed,
      });

      form.handleSubmit();

      expect(onSubmitFailed).toHaveBeenCalledOnce();
    });

    it("runs change and blur validators for all registered fields", () => {
      const changeValidator = vi.fn(() => null);
      const blurValidator = vi.fn(() => null);
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: changeValidator,
          email: changeValidator,
        },
        blurValidators: {
          name: blurValidator,
          "profile.age": blurValidator,
        },
      });

      form.handleSubmit();

      expect(changeValidator).toHaveBeenCalledTimes(2);
      expect(changeValidator.mock.calls).toEqual([[{ value: "" }], [{ value: "" }]]);

      expect(blurValidator).toHaveBeenCalledTimes(2);
      expect(blurValidator.mock.calls).toEqual([[{ value: "" }], [{ value: 0 }]]);
    });

    it("stores sync validation errors in field error maps", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is required",
        },
        blurValidators: {
          email: () => "Email is required",
        },
      });

      form.handleSubmit();

      expect(form.getFieldErrorMap("name").change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Name is required",
          meta: {},
        },
      ]);
      expect(form.getFieldErrorMap("email").blur).toEqual([
        {
          path: "email",
          type: "blur",
          message: "Email is required",
          meta: {},
        },
      ]);
    });

    it("marks validated fields as touched", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => null,
        },
        blurValidators: {
          email: () => null,
        },
      });

      form.handleSubmit();

      expect(form.getFieldMeta("name").isTouched).toBe(true);
      expect(form.getFieldMeta("email").isTouched).toBe(true);
    });

    it("sets form meta isTouched to true", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is required",
        },
      });

      form.handleSubmit();

      expect(form.meta.get().isTouched).toBe(true);
    });

    it("increments submit count", () => {
      const form = new FormControl({ defaultValues });

      form.handleSubmit();

      expect(form.meta.get().submitCount).toBe(1);
    })

    it("does not run async validators", async () => {
      vi.useFakeTimers();

      const asyncValidator = vi.fn(async () => "Async error");
      const onSubmit = vi.fn();
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          name: asyncValidator,
        },
        onSubmit,
      });

      form.handleSubmit();
      await vi.advanceTimersByTimeAsync(300);

      expect(asyncValidator).not.toHaveBeenCalled();
      expect(onSubmit).toHaveBeenCalledOnce();

      vi.useRealTimers();
    });
  });
});
