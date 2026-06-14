import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  describe("getFieldValue", () => {
    it("returns shallow field values", () => {
      const form = new FormControl({ defaultValues });

      expect(form.getFieldValue("name")).toBe("John");
    });

    it("returns nested field values", () => {
      const form = new FormControl({ defaultValues });

      expect(form.getFieldValue("profile.age")).toBe(30);
    });
  });

  describe("getFieldMeta", () => {
    it("returns default meta for fresh fields", () => {
      const form = new FormControl({ defaultValues });

      expect(form.getFieldMeta("name")).toEqual({
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
    });

    it("returns stored meta after it has been set", () => {
      const form = new FormControl({ defaultValues });
      const meta = {
        isTouched: true,
        isDirty: true,
        isValidating: false,
      };

      form.setFieldMeta("name", meta);

      expect(form.getFieldMeta("name")).toEqual(meta);
    });
  });

  describe("getFieldErrorMap", () => {
    it("returns an empty error map for fresh fields", () => {
      const form = new FormControl({ defaultValues });

      expect(form.getFieldErrorMap("name")).toEqual({
        change: [],
        blur: [],
        changeAsync: [],
        blurAsync: [],
      });
    });

    it("returns stored errors after validation", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          email: () => "Invalid email",
        },
      });

      form.setFieldValue("email", "bad");

      expect(form.getFieldErrorMap("email").change).toEqual([
        {
          path: "email",
          type: "change",
          message: "Invalid email",
          meta: {},
        },
      ]);
    });
  });

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

  describe("subscribeMeta", () => {
    it("notifies subscribers when form meta changes", () => {
      const form = new FormControl({ defaultValues });
      const subscriber = vi.fn();

      form.meta.subscribe(subscriber);
      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
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

  describe("nextFieldState", () => {
    it("merges partial state with current field value, meta, and errors", () => {
      const form = new FormControl({ defaultValues });
      const subscriber = vi.fn();

      form.subscribeField("name", subscriber);
      form.nextFieldState("name", {
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
    });

    it("does not notify form meta", () => {
      const form = new FormControl({ defaultValues });
      const metaSubscriber = vi.fn();

      form.meta.subscribe(metaSubscriber);
      form.nextFieldState("name", {
        meta: {
          isTouched: true,
          isDirty: true,
          isValidating: false,
        },
      });

      expect(metaSubscriber).not.toHaveBeenCalledOnce();
    });
  });

  describe("_validateSync", () => {
    it("returns an empty array when no validator is registered", () => {
      const form = new FormControl({ defaultValues });

      expect(form._validateSync("name", "change")).toEqual([]);
    });

    it("does not update field state when no validator is registered", () => {
      const form = new FormControl({ defaultValues });
      const nextFieldState = vi.spyOn(form, "nextFieldState");

      form._validateSync("name", "change");

      expect(nextFieldState).not.toHaveBeenCalled();
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
      const nextFieldState = vi.spyOn(form, "nextFieldState");

      const errors = await form.validateAsync("name", "change", new AbortController());

      expect(errors).toEqual([]);
      expect(nextFieldState).not.toHaveBeenCalled();
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
        isTouched: false,
        isDirty: false,
        isValidating: true,
      });

      const nextFieldState = vi.spyOn(form, "nextFieldState");

      await form.validateAsync("name", "change", new AbortController());

      const validatingOnlyUpdates = nextFieldState.mock.calls.filter(
        ([, state]) =>
          state.meta?.isValidating === true &&
          state.value === undefined &&
          state.errorMap === undefined,
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

  describe("updateMeta", () => {
    it("keeps form meta false when no field meta exists", () => {
      const form = new FormControl({ defaultValues });

      form.updateMeta();

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

      form.updateMeta();

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

      form.updateMeta();

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

      form.updateMeta();

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

      form.updateMeta();

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
      form.updateMeta();

      form.fieldMetaMap.set("name", {
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
      form.updateMeta();

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

      form.updateMeta();

      expect(subscriber).toHaveBeenCalledOnce();
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

    it("aggregates form meta from all fields", () => {
      const form = new FormControl({ defaultValues });
      const metaSubscriber = vi.fn();

      form.meta.subscribe(metaSubscriber);

      form.setFieldMeta("name", {
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });
      form.setFieldMeta("email", {
        isTouched: false,
        isDirty: true,
        isValidating: false,
      });

      expect(form.meta.get()).toEqual({
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
      expect(metaSubscriber).toHaveBeenLastCalledWith(form.meta.get());
    });

    it("resets form meta when all field meta becomes clean", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldMeta("name", {
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });

      form.setFieldMeta("name", {
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });

      expect(form.meta.get()).toEqual({
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
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
