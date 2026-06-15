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
  describe("_validateSync", () => {
    it("returns an empty array when no validator is registered", () => {
      const form = new FormControl({ defaultValues });

      expect(form._validateSync("name", "change")).toEqual([]);
    });

    it("does not update field state when no validator is registered", () => {
      const form = new FormControl({ defaultValues });
      const updateAndNotifyField = vi.spyOn(form, "updateAndNotifyField");

      form._validateSync("name", "change");

      expect(updateAndNotifyField).not.toHaveBeenCalled();
    });

    it("validates with the current field value and returns sync errors", () => {
      const validator = vi.fn(() => "Name is required");
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: validator },
      });

      const errors = form._validateSync("name", "change");

      expect(validator).toHaveBeenCalledWith({ value: "John" });
      expect(errors).toEqual([
        {
          path: "name",
          type: "change",
          message: "Name is required",
          meta: {},
        },
      ]);
    });

    it("validates with blur validators", () => {
      const validator = vi.fn(() => "Email is required");
      const form = new FormControl({
        defaultValues,
        blurValidators: { email: validator },
      });

      const errors = form._validateSync("email", "blur");

      expect(validator).toHaveBeenCalledWith({ value: "john@example.com" });
      expect(errors).toEqual([
        {
          path: "email",
          type: "blur",
          message: "Email is required",
          meta: {},
        },
      ]);
    });

    it("stores errors in the field error map for the matching cause", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: () => "Name is required" },
      });

      form._validateSync("name", "change");

      expect(form.getFieldErrorMap("name").change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Name is required",
          meta: {},
        },
      ]);
    });

    it("preserves errors from other causes", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: () => "Change error" },
        blurValidators: { name: () => "Blur error" },
      });

      form._validateSync("name", "blur");

      expect(form.getFieldErrorMap("name").blur).toEqual([
        {
          path: "name",
          type: "blur",
          message: "Blur error",
          meta: {},
        },
      ]);

      form._validateSync("name", "change");

      expect(form.getFieldErrorMap("name")).toEqual({
        change: [
          {
            path: "name",
            type: "change",
            message: "Change error",
            meta: {},
          },
        ],
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
    });

    it("replaces previous errors for the same cause on re-validation", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: ({ value }) => (value === "John" ? "First error" : "Second error"),
        },
      });

      form._validateSync("name", "change");
      form.setFieldValue("name", "Jane", { dontValidate: true });
      form._validateSync("name", "change");

      expect(form.getFieldErrorMap("name").change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Second error",
          meta: {},
        },
      ]);
    });

    it("returns an empty array when the validator returns no errors", () => {
      const validator = vi.fn(() => undefined);
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: validator },
      });

      const errors = form._validateSync("name", "change");

      expect(errors).toEqual([]);
      expect(form.getFieldErrorMap("name").change).toEqual([]);
    });

    it("handles multiple error messages from the validator", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => ["Too short", "Invalid characters"],
        },
      });

      const errors = form._validateSync("name", "change");

      expect(errors).toEqual([
        {
          path: "name",
          type: "change",
          message: "Too short",
          meta: {},
        },
        {
          path: "name",
          type: "change",
          message: "Invalid characters",
          meta: {},
        },
      ]);
    });

    it("validates nested field paths", () => {
      const validator = vi.fn(() => "Age must be positive");
      const form = new FormControl({
        defaultValues,
        changeValidators: { "profile.age": validator },
      });

      const errors = form._validateSync("profile.age", "change");

      expect(validator).toHaveBeenCalledWith({ value: 30 });
      expect(errors).toEqual([
        {
          path: "profile.age",
          type: "change",
          message: "Age must be positive",
          meta: {},
        },
      ]);
    });

    it("notifies field subscribers with updated errors", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: () => "Name is required" },
      });
      const subscriber = vi.fn();

      form.subscribeField("name", subscriber);
      form._validateSync("name", "change");

      expect(subscriber).toHaveBeenLastCalledWith({
        value: "John",
        meta: {
          isBlurred: false,
          isTouched: true,
          isDirty: false,
          isValidating: false,
        },
        errorMap: {
          change: [
            {
              path: "name",
              type: "change",
              message: "Name is required",
              meta: {},
            },
          ],
          blur: [],
          changeAsync: [],
          blurAsync: [],
        },
      });
    });
  });

  describe("validateAsync", () => {
    it("returns immediately when no async validator is registered", async () => {
      const form = new FormControl({ defaultValues });
      const updateAndNotifyField = vi.spyOn(form, "updateAndNotifyField");

      const errors = await form.validateAsync("name", "change", new AbortController());

      expect(errors).toEqual([]);
      expect(updateAndNotifyField).not.toHaveBeenCalled();
      expect(form.getFieldMeta("name").isValidating).toBe(false);
    });

    it("returns immediately when the abort signal is already aborted", async () => {
      const validator = vi.fn(async () => "Async error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });
      const abortCtrl = new AbortController();

      abortCtrl.abort();

      await form.validateAsync("name", "change", abortCtrl);

      expect(validator).not.toHaveBeenCalled();
      expect(form.getFieldMeta("name").isValidating).toBe(false);
    });

    it("validates with the current field value and stores async errors", async () => {
      const validator = vi.fn(async () => "Async error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      await form.validateAsync("name", "change", new AbortController());

      expect(validator).toHaveBeenCalledWith({ value: "John" });
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

    it("skips the validating meta broadcast when the field is already validating", async () => {
      const validator = vi.fn(async () => undefined);
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });

      form.fieldMetaMap.set("name", {
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: true,
      });

      const updateAndNotifyField = vi.spyOn(form, "updateAndNotifyField");

      await form.validateAsync("name", "change", new AbortController());

      const validatingOnlyUpdates = updateAndNotifyField.mock.calls.filter(
        ([, changes]) =>
          changes.meta?.isValidating === true &&
          changes.value === undefined &&
          changes.errorMap === undefined,
      );

      expect(validatingOnlyUpdates).toHaveLength(0);
    });

    it("discards results when aborted after the validator resolves", async () => {
      const validator = vi.fn(async () => "Async error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });
      const abortCtrl = new AbortController();

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

      const validation = form.validateAsync("name", "change", abortCtrl);
      abortCtrl.abort();
      await validation;

      expect(validator).toHaveBeenCalledOnce();
      expect(form.getFieldErrorMap("name").changeAsync).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Existing error",
          meta: {},
        },
      ]);
    });

    it("logs validator errors and clears the running state", async () => {
      const validatorError = new Error("Validator failed");
      const validator = vi.fn(async () => {
        throw validatorError;
      });
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      await form.validateAsync("name", "change", new AbortController());

      expect(consoleError).toHaveBeenCalledWith(validatorError);
      expect(form.getFieldMeta("name").isValidating).toBe(false);
      expect(form.runningValidatorMap.isAnyRunning("name")).toBe(false);
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
