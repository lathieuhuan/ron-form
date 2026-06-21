import { describe, expect, it, vi } from "vitest";
import { FormCore } from "../FormCore";
import { DEFAULT_ERROR_MAP, DEFAULT_META } from "../constants";

const defaultValues = {
  name: "John",
  email: "john@example.com",
  profile: {
    age: 30,
  },
};

describe("FormCore", () => {
  describe("constructor", () => {
    it("initializes with cloned default values", () => {
      const form = new FormCore({ defaultValues });

      expect(form.values).toEqual(defaultValues);
      expect(form.values).not.toBe(defaultValues);
      expect(form.values.profile).not.toBe(defaultValues.profile);
    });

    it("initializes with an empty object when default values are omitted", () => {
      const form = new FormCore();

      expect(form.values).toEqual({});
    });

    it("initializes form meta as not blurred, untouched, clean, and not validating, and submit count 0", () => {
      const form = new FormCore({ defaultValues });

      expect(form.meta.get()).toEqual({
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
        submitCount: 0,
      });
    });

    it("uses the provided async debounce delay", () => {
      const form = new FormCore({ defaultValues, asyncDebounceMs: 500 });

      expect(form.asyncDebounceMs).toBe(500);
    });

    it("defaults async debounce to 300ms", () => {
      const form = new FormCore({ defaultValues });

      expect(form.asyncDebounceMs).toBe(300);
    });
  });

  describe("getFieldValue", () => {
    it("returns shallow field values", () => {
      const form = new FormCore({ defaultValues });

      expect(form.getFieldValue("name")).toBe("John");
    });

    it("returns nested field values", () => {
      const form = new FormCore({ defaultValues });

      expect(form.getFieldValue("profile.age")).toBe(30);
    });
  });

  describe("getFieldMeta", () => {
    it("returns default meta for fresh fields", () => {
      const form = new FormCore({ defaultValues });

      expect(form.getFieldMeta("name")).toEqual(DEFAULT_META);
    });

    it("returns stored meta after it has been set", () => {
      const form = new FormCore({ defaultValues });
      const meta = {
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      };

      form.updateAndNotifyField("email", {
        meta,
      });

      expect(form.getFieldMeta("email")).toEqual(meta);
    });
  });

  describe("getFieldErrorMap", () => {
    it("returns an empty error map for fresh fields", () => {
      const form = new FormCore({ defaultValues });

      expect(form.getFieldErrorMap("name")).toEqual(DEFAULT_ERROR_MAP);
    });

    it("returns stored errors after validation", () => {
      const form = new FormCore({
        defaultValues,
        changeValidators: {
          email: () => "Invalid email",
        },
      });

      form.updateAndNotifyField("email", {
        errorMap: {
          change: [
            {
              path: "email",
              type: "change",
              message: "Invalid email",
              meta: {},
            },
          ],
        },
      });

      // form.setFieldValue("email", "bad");

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
      const form = new FormCore({ defaultValues });
      const subscriber = vi.fn();

      form.subscribeField("name", subscriber);

      const meta = form.getFieldMeta("name");
      const errorMap = form.getFieldErrorMap("name");

      form.fieldSubjects.get("name")?.next({
        value: "Jane",
        meta,
        errorMap,
      });

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: "Jane",
        meta,
        errorMap,
      });
    });

    it("stops notifying after unsubscribe", () => {
      const form = new FormCore({ defaultValues });
      const subscriber = vi.fn();

      const unsubscribe = form.subscribeField("name", subscriber);
      unsubscribe();

      const meta = form.getFieldMeta("name");
      const errorMap = form.getFieldErrorMap("name");

      form.fieldSubjects.get("name")?.next({
        value: "Jane",
        meta,
        errorMap,
      });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("updateAndNotifyField", () => {
    it("short circuits if value, meta, and errorMap are not passed/undefined", () => {
      const form = new FormCore({ defaultValues });
      const subscriber = vi.fn();
      form.subscribeField("name", subscriber);

      form.updateAndNotifyField("name", {});
      expect(subscriber).not.toHaveBeenCalled();

      form.updateAndNotifyField("name", {
        meta: undefined,
        errorMap: undefined,
      });
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("merges partial state with current field value, meta, and errors", () => {
      const form = new FormCore({ defaultValues });
      const subscriber = vi.fn();

      form.subscribeField("name", subscriber);
      form.updateAndNotifyField("name", {
        meta: {
          isBlurred: false,
          isTouched: true,
          isDirty: false,
          isValidating: false,
        },
      });

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: "John",
        meta: {
          isBlurred: false,
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
        isBlurred: false,
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });
    });

    it("persists error map changes to the field error map", () => {
      const form = new FormCore({ defaultValues });
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
      const form = new FormCore({ defaultValues });
      const metaSubscriber = vi.fn();

      form.meta.subscribe(metaSubscriber);
      form.updateAndNotifyField("name", {
        meta: {
          isBlurred: false,
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
      const form = new FormCore({ defaultValues });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
        submitCount: 0,
      });
    });

    it("aggregates isTouched from any field", () => {
      const form = new FormCore({ defaultValues });

      form.fieldMetaMap.set("name", {
        isBlurred: false,
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });
      form.fieldMetaMap.set("email", {
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: false,
        isValidating: false,
        submitCount: 0,
      });
    });

    it("aggregates isDirty from any field", () => {
      const form = new FormCore({ defaultValues });

      form.fieldMetaMap.set("name", {
        isBlurred: false,
        isTouched: false,
        isDirty: true,
        isValidating: false,
      });
      form.fieldMetaMap.set("email", {
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isBlurred: false,
        isTouched: false,
        isDirty: true,
        isValidating: false,
        submitCount: 0,
      });
    });

    it("aggregates isValidating from any field", () => {
      const form = new FormCore({ defaultValues });

      form.fieldMetaMap.set("name", {
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: true,
      });
      form.fieldMetaMap.set("email", {
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: true,
        submitCount: 0,
      });
    });

    it("aggregates all flags across multiple fields", () => {
      const form = new FormCore({ defaultValues });

      form.fieldMetaMap.set("name", {
        isBlurred: false,
        isTouched: true,
        isDirty: false,
        isValidating: false,
      });
      form.fieldMetaMap.set("email", {
        isBlurred: false,
        isTouched: false,
        isDirty: true,
        isValidating: false,
      });
      form.fieldMetaMap.set("profile.age", {
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: true,
      });

      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: true,
        submitCount: 0,
      });
    });

    it("resets aggregated flags when all field meta is clean", () => {
      const form = new FormCore({ defaultValues });

      form.fieldMetaMap.set("name", {
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
      form.syncMeta();

      form.fieldMetaMap.set("name", {
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
      form.syncMeta();

      expect(form.meta.get()).toEqual({
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
        submitCount: 0,
      });
    });

    it("notifies meta subscribers", () => {
      const form = new FormCore({ defaultValues });
      const subscriber = vi.fn();

      form.meta.subscribe(subscriber);
      form.fieldMetaMap.set("name", {
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });

      form.syncMeta();

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
        submitCount: 0,
      });
    });
  });

  describe("_validateAsync", () => {
    it("returns immediately when no async validator is registered", async () => {
      const form = new FormCore({ defaultValues });
      const updateAndNotifyField = vi.spyOn(form, "updateAndNotifyField");

      const errors = await form._validateAsync("name", "change", new AbortController());

      expect(errors).toEqual([]);
      expect(updateAndNotifyField).not.toHaveBeenCalled();
      expect(form.getFieldMeta("name").isValidating).toBe(false);
    });

    it("validates with the current field value and stores async errors", async () => {
      const validator = vi.fn(async () => "Async error");
      const form = new FormCore({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      await form._validateAsync("name", "change", new AbortController());

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
      const form = new FormCore({
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

      await form._validateAsync("name", "change", new AbortController());

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
      const form = new FormCore({
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

      const validation = form._validateAsync("name", "change", abortCtrl);
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

    it("returns the resolved errors", async () => {
      const validator = vi.fn(async () => "Async error");
      const form = new FormCore({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });

      const errors = await form._validateAsync("name", "change", new AbortController());

      expect(errors).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Async error",
          meta: {},
        },
      ]);
    });

    it("sets isValidating to true while the async validator is pending", async () => {
      let resolveValidator: (value: string | undefined) => void = () => {};
      const validator = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            resolveValidator = resolve;
          }),
      );
      const form = new FormCore({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      const validation = form._validateAsync("name", "change", new AbortController());

      await Promise.resolve();

      expect(form.getFieldMeta("name").isValidating).toBe(true);
      expect(form.runningValidatorMap.isAnyRunning("name")).toBe(true);
      expect(fieldSubscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({ isValidating: true }),
        }),
      );

      resolveValidator(undefined);
      await validation;

      expect(form.getFieldMeta("name").isValidating).toBe(false);
      expect(form.runningValidatorMap.isAnyRunning("name")).toBe(false);
    });

    it("validates with blur async validators when cause is blur", async () => {
      const validator = vi.fn(async () => "Blur async error");
      const form = new FormCore({
        defaultValues,
        blurAsyncValidators: { email: validator },
      });

      const errors = await form._validateAsync("email", "blur", new AbortController());

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
      const form = new FormCore({
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

      const errors = await form._validateAsync("name", "change", new AbortController());

      expect(errors).toEqual([]);
      expect(form.getFieldErrorMap("name").changeAsync).toEqual([]);
    });

    it("preserves errors for other async causes", async () => {
      const validator = vi.fn(async () => "Change async error");
      const form = new FormCore({
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

      await form._validateAsync("name", "change", new AbortController());

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

    it("stores thrown validator errors and clears the running state", async () => {
      const validator = vi.fn(async () => {
        throw new Error("Validator failed");
      });
      const form = new FormCore({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });

      const errors = await form._validateAsync("name", "change", new AbortController());

      expect(errors).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Validator failed",
          meta: { meta: {} },
        },
      ]);
      expect(form.getFieldErrorMap("name").changeAsync).toEqual(errors);
      expect(form.getFieldMeta("name").isValidating).toBe(false);
      expect(form.runningValidatorMap.isAnyRunning("name")).toBe(false);
    });

    it("keeps isValidating true while another cause validation is still running", async () => {
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
      const form = new FormCore({
        defaultValues,
        changeAsyncValidators: { name: changeValidator },
        blurAsyncValidators: { name: blurValidator },
      });

      const changeValidation = form._validateAsync("name", "change", new AbortController());
      const blurValidation = form._validateAsync("name", "blur", new AbortController());

      await Promise.resolve();

      expect(form.getFieldMeta("name").isValidating).toBe(true);

      resolveChange(undefined);
      await changeValidation;

      expect(form.getFieldMeta("name").isValidating).toBe(true);

      resolveBlur(undefined);
      await blurValidation;

      expect(form.getFieldMeta("name").isValidating).toBe(false);
    });
  });
});
