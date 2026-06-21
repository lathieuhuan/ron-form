import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormControl } from "../FormControl";

const defaultValues = {
  name: "John",
  email: "john@example.com",
  profile: {
    age: 30,
  },
};

describe("FormControl validation", () => {
  describe("validateSync", () => {
    it("returns an empty array when no sync validator is registered", () => {
      const form = new FormControl({ defaultValues });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      const errors = form.validateSync("name", "change");

      expect(errors).toEqual([]);
      expect(form.getFieldErrorMap("name").change).toEqual([]);
      expect(fieldSubscriber).toHaveBeenCalledOnce();
    });

    it("validates with the current field value and stores sync errors", () => {
      const validator = vi.fn(() => "Name is required");
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: validator },
      });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      const errors = form.validateSync("name", "change");

      expect(validator).toHaveBeenCalledWith({ value: "John" });
      expect(errors).toEqual([
        {
          path: "name",
          type: "change",
          message: "Name is required",
          meta: {},
        },
      ]);
      expect(form.getFieldErrorMap("name").change).toEqual(errors);
      expect(fieldSubscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          errorMap: expect.objectContaining({
            change: errors,
          }),
        }),
      );
    });

    it("validates with blur validators when cause is blur", () => {
      const validator = vi.fn(() => "Email is invalid");
      const form = new FormControl({
        defaultValues,
        blurValidators: { email: validator },
      });

      const errors = form.validateSync("email", "blur");

      expect(validator).toHaveBeenCalledWith({ value: "john@example.com" });
      expect(errors).toEqual([
        {
          path: "email",
          type: "blur",
          message: "Email is invalid",
          meta: {},
        },
      ]);
      expect(form.getFieldErrorMap("email").blur).toEqual(errors);
    });

    it("clears existing errors for the cause when validation passes", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: () => undefined },
      });

      form.fieldErrorMap.set("name", {
        change: [
          {
            path: "name",
            type: "change",
            message: "Existing error",
            meta: {},
          },
        ],
        blur: [],
        changeAsync: [],
        blurAsync: [],
      });

      const errors = form.validateSync("name", "change");

      expect(errors).toEqual([]);
      expect(form.getFieldErrorMap("name").change).toEqual([]);
    });

    it("preserves errors for other causes", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: () => "Change error" },
      });

      form.fieldErrorMap.set("name", {
        change: [],
        blur: [
          {
            path: "name",
            type: "blur",
            message: "Blur error",
            meta: {},
          },
        ],
        changeAsync: [],
        blurAsync: [],
      });

      form.validateSync("name", "change");

      expect(form.getFieldErrorMap("name").change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Change error",
          meta: {},
        },
      ]);
      expect(form.getFieldErrorMap("name").blur).toEqual([
        {
          path: "name",
          type: "blur",
          message: "Blur error",
          meta: {},
        },
      ]);
    });

    it("sets isTouched on field and form meta when shouldTouch is true", () => {
      const form = new FormControl({ defaultValues });

      form.validateSync("name", "change", { shouldTouch: true });

      expect(form.getFieldMeta("name").isTouched).toBe(true);
      expect(form.meta.get().isTouched).toBe(true);
    });

    it("sets isBlurred on field and form meta when shouldBlur is true", () => {
      const form = new FormControl({ defaultValues });

      form.validateSync("name", "change", { shouldBlur: true });

      expect(form.getFieldMeta("name").isBlurred).toBe(true);
      expect(form.meta.get().isBlurred).toBe(true);
    });

    it("does not override existing touched or blurred meta", () => {
      const form = new FormControl({ defaultValues });

      form.fieldMetaMap.set("name", {
        isBlurred: true,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });

      form.validateSync("name", "change", {
        shouldTouch: true,
        shouldBlur: true,
      });

      expect(form.getFieldMeta("name")).toEqual({
        isBlurred: true,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });
  });

  describe("validateAsync", () => {
    it("returns an empty array when no async validator is registered", async () => {
      const form = new FormControl({ defaultValues });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      const errors = await form.validateAsync("name", "change");

      expect(errors).toEqual([]);
      expect(form.getFieldErrorMap("name").changeAsync).toEqual([]);
      expect(form.meta.get().isValidating).toBe(false);
      expect(fieldSubscriber).not.toHaveBeenCalled();
    });

    it("validates with the current field value and stores async errors", async () => {
      const validator = vi.fn(async () => "Async error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      const errors = await form.validateAsync("name", "change");

      expect(validator).toHaveBeenCalledWith({ value: "John" });
      expect(errors).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Async error",
          meta: {},
        },
      ]);
      expect(form.getFieldErrorMap("name").changeAsync).toEqual(errors);
      expect(form.getFieldMeta("name").isValidating).toBe(false);
      expect(form.meta.get().isValidating).toBe(false);
      expect(fieldSubscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          errorMap: expect.objectContaining({
            changeAsync: errors,
          }),
        }),
      );
    });

    it("returns the resolved errors", async () => {
      const validator = vi.fn(async () => "Async error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });

      const errors = await form.validateAsync("name", "change");

      expect(errors).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Async error",
          meta: {},
        },
      ]);
    });

    it("sets form meta isValidating while async validation is running", async () => {
      let resolveValidator: (value: string | undefined) => void = () => {};
      const validator = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            resolveValidator = resolve;
          }),
      );
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });

      const validation = form.validateAsync("name", "change");

      await Promise.resolve();

      expect(form.getFieldMeta("name").isValidating).toBe(true);
      expect(form.meta.get().isValidating).toBe(true);

      resolveValidator(undefined);
      await validation;

      expect(form.getFieldMeta("name").isValidating).toBe(false);
      expect(form.meta.get().isValidating).toBe(false);
    });

    it("validates with blur async validators when cause is blur", async () => {
      const validator = vi.fn(async () => "Blur async error");
      const form = new FormControl({
        defaultValues,
        blurAsyncValidators: { email: validator },
      });

      const errors = await form.validateAsync("email", "blur");

      expect(validator).toHaveBeenCalledWith({ value: "john@example.com" });
      expect(errors).toEqual([
        {
          path: "email",
          type: "blurAsync",
          message: "Blur async error",
          meta: {},
        },
      ]);
      expect(form.getFieldErrorMap("email").blurAsync).toEqual(errors);
    });

    it("clears existing async errors when validation passes", async () => {
      const validator = vi.fn(async () => undefined);
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });

      form.fieldErrorMap.set("name", {
        change: [],
        blur: [],
        changeAsync: [
          {
            path: "name",
            type: "changeAsync",
            message: "Existing error",
            meta: {},
          },
        ],
        blurAsync: [],
      });

      const errors = await form.validateAsync("name", "change");

      expect(errors).toEqual([]);
      expect(form.getFieldErrorMap("name").changeAsync).toEqual([]);
    });

    it("preserves errors for other async causes", async () => {
      const validator = vi.fn(async () => "Change async error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });

      form.fieldErrorMap.set("name", {
        change: [],
        blur: [],
        changeAsync: [],
        blurAsync: [
          {
            path: "name",
            type: "blurAsync",
            message: "Blur async error",
            meta: {},
          },
        ],
      });

      await form.validateAsync("name", "change");

      expect(form.getFieldErrorMap("name").changeAsync).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Change async error",
          meta: {},
        },
      ]);
      expect(form.getFieldErrorMap("name").blurAsync).toEqual([
        {
          path: "name",
          type: "blurAsync",
          message: "Blur async error",
          meta: {},
        },
      ]);
    });

    it("aborts the previous async validation when called again for the same field and cause", async () => {
      let resolveFirstValidator: (value: string | undefined) => void = () => {};
      const firstValidator = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            resolveFirstValidator = resolve;
          }),
      );
      const secondValidator = vi.fn(async () => "Second error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: firstValidator },
      });

      const firstValidation = form.validateAsync("name", "change");

      await Promise.resolve();

      form.asyncValidators.change.name = secondValidator;
      const secondValidation = form.validateAsync("name", "change");

      resolveFirstValidator("First error");
      await firstValidation;
      await secondValidation;

      expect(firstValidator).toHaveBeenCalledOnce();
      expect(secondValidator).toHaveBeenCalledOnce();
      expect(form.getFieldErrorMap("name").changeAsync).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Second error",
          meta: {},
        },
      ]);
    });

    it("keeps form meta isValidating true while another cause validation is still running", async () => {
      let resolveChange: (value: string | undefined) => void = () => {};
      let resolveBlur: (value: string | undefined) => void = () => {};
      const changeValidator = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            resolveChange = resolve;
          }),
      );
      const blurValidator = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            resolveBlur = resolve;
          }),
      );
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: changeValidator },
        blurAsyncValidators: { name: blurValidator },
      });

      const changeValidation = form.validateAsync("name", "change");
      const blurValidation = form.validateAsync("name", "blur");

      await Promise.resolve();

      expect(form.meta.get().isValidating).toBe(true);

      resolveChange(undefined);
      await changeValidation;

      expect(form.meta.get().isValidating).toBe(true);

      resolveBlur(undefined);
      await blurValidation;

      expect(form.meta.get().isValidating).toBe(false);
    });

    it("clears pending debounced validation when called directly", async () => {
      vi.useFakeTimers();

      const debouncedValidator = vi.fn(async () => "Debounced error");
      const directValidator = vi.fn(async () => "Direct error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: debouncedValidator },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("name", "Jane");
      form.asyncValidators.change.name = directValidator;

      const errors = await form.validateAsync("name", "change");

      await vi.advanceTimersByTimeAsync(100);

      expect(debouncedValidator).not.toHaveBeenCalled();
      expect(directValidator).toHaveBeenCalledOnce();
      expect(errors).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Direct error",
          meta: {},
        },
      ]);

      vi.useRealTimers();
    });
  });

  describe("async validation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("runs async validators after debounce when sync validation passes", async () => {
      const asyncValidator = vi.fn(async () => "Async error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          name: asyncValidator,
        },
        asyncDebounceMs: 100,
      });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);
      form.setFieldValue("name", "Jane");

      expect(asyncValidator).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(100);

      expect(asyncValidator).toHaveBeenCalledWith({ value: "Jane" });
      expect(form.getFieldErrorMap("name").changeAsync).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Async error",
          meta: {},
        },
      ]);
      expect(form.getFieldMeta("name").isValidating).toBe(false);
      expect(fieldSubscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          value: "Jane",
          errorMap: expect.objectContaining({
            changeAsync: [
              {
                path: "name",
                type: "changeAsync",
                message: "Async error",
                meta: {},
              },
            ],
          }),
        }),
      );
    });

    it("sets isValidating while async validation is running", async () => {
      let resolveValidator: (value: string | undefined) => void = () => {};
      const asyncValidator = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            resolveValidator = resolve;
          }),
      );
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          name: asyncValidator,
        },
        asyncDebounceMs: 50,
      });

      form.setFieldValue("name", "Jane");
      await vi.advanceTimersByTimeAsync(50);

      expect(form.getFieldMeta("name").isValidating).toBe(true);
      expect(form.meta.get().isValidating).toBe(true);

      resolveValidator(undefined);
      await vi.runAllTimersAsync();

      expect(form.getFieldMeta("name").isValidating).toBe(false);
      expect(form.meta.get().isValidating).toBe(false);
    });

    it("aborts the previous async validation when the value changes again", async () => {
      let resolveFirstValidator: (value: string | undefined) => void = () => {};
      const firstValidator = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            resolveFirstValidator = resolve;
          }),
      );
      const secondValidator = vi.fn(async () => "Second error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          name: firstValidator,
        },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("name", "Jane");
      await vi.advanceTimersByTimeAsync(100);

      expect(firstValidator).toHaveBeenCalledOnce();
      expect(form.getFieldMeta("name").isValidating).toBe(true);

      form.asyncValidators.change.name = secondValidator;
      form.setFieldValue("name", "John");
      await vi.advanceTimersByTimeAsync(100);

      resolveFirstValidator("First error");
      await vi.runAllTimersAsync();

      expect(secondValidator).toHaveBeenCalledOnce();
      expect(form.getFieldErrorMap("name").changeAsync).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Second error",
          meta: {},
        },
      ]);
    });

    it("clears pending debounced validation when the value changes again", async () => {
      const asyncValidator = vi.fn(async () => "Async error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          name: asyncValidator,
        },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("name", "Jane");
      await vi.advanceTimersByTimeAsync(50);
      form.setFieldValue("name", "John");
      await vi.advanceTimersByTimeAsync(100);

      expect(asyncValidator).toHaveBeenCalledOnce();
      expect(asyncValidator).toHaveBeenCalledWith({ value: "John" });
    });
  });
});
