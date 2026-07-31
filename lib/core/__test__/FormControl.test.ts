import { describe, expect, it, vi } from "vitest";
import { FormControl } from "../FormControl";
import { DEFAULT_CHANGE_CAUSE, DEFAULT_FORM_META, DEFAULT_META } from "../constants";

const defaultValues = {
  name: "",
  email: "",
  profile: {
    age: 0,
  },
};

describe("FormControl", () => {
  describe("constructor", () => {
    it("creates valueSubjects and registers subscribers for configured fields", () => {
      const nameSubscriber = vi.fn();
      const profileAgeSubscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          name: nameSubscriber,
          "profile.age": profileAgeSubscriber,
        },
      });

      expect(form.valueSubjects.get("name")).toBeDefined();
      expect(form.valueSubjects.get("profile.age")).toBeDefined();
      expect(form.valueSubjects.get("name")?.observers).toContain(nameSubscriber);
      expect(form.valueSubjects.get("profile.age")?.observers).toContain(profileAgeSubscriber);
      expect(form.unsubscribers).toHaveLength(2);
    });
  });

  describe("setFieldValue", () => {
    it("updates the field value", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(form.getFieldValue("name")).toBe("Jane");
      expect(form.values.name).toBe("Jane");
    });

    it("clones the value if it is a plain object", () => {
      const form = new FormControl({ defaultValues });
      const newProfile = { age: 1 };

      form.setFieldValue("profile", newProfile, { dontValidate: true });
      newProfile.age = 2;

      expect(form.getFieldValue("profile.age")).toBe(1);
      expect(form.getFieldValue("profile")).not.toBe(newProfile);
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

    it("marks parent and nested subFields as touched and dirty when setting an object value", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("profile", { age: 25 }, { dontValidate: true });

      expect(form.getFieldMeta("profile")).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
      expect(form.getFieldMeta("profile.age")).toEqual({
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

    it("respects dontTouch and dontDirty options on nested subFields", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldMeta("profile", {
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
      form.setFieldMeta("profile.age", {
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });

      form.setFieldValue(
        "profile",
        { age: 25 },
        {
          dontTouch: true,
          dontDirty: true,
          dontValidate: true,
        },
      );

      expect(form.getFieldMeta("profile")).toEqual({
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
      expect(form.getFieldMeta("profile.age")).toEqual({
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

      expect(validator).toHaveBeenCalledWith({ value: "", form });
      expect(form.getFieldErrorMap("name").change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Name is required",
          meta: {},
        },
      ]);
    });

    it("runs change validators on nested subFields when setting a parent object", () => {
      const profileAgeValidator = vi.fn(({ value }: { value: number }) =>
        value < 18 ? "Must be 18+" : null,
      );
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          "profile.age": profileAgeValidator,
        },
      });

      form.setFieldValue("profile", { age: 16 });

      expect(profileAgeValidator).toHaveBeenCalledWith({ value: 16, form });
      expect(form.getFieldErrorMap("profile.age").change).toEqual([
        {
          path: "profile.age",
          type: "change",
          message: "Must be 18+",
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

    it("keeps change errors when dontValidate is enabled", async () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: ({ value }) => (value.length < 3 ? "Error" : null),
        },
      });

      form.setFieldValue("name", "Na");

      const errorMap1 = form.getFieldErrorMap("name");
      expect(errorMap1.change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Error",
          meta: {},
        },
      ]);

      form.setFieldValue("name", "Joel", { dontValidate: true });

      const errorMap2 = form.getFieldErrorMap("name");
      expect(errorMap2.change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Error",
          meta: {},
        },
      ]);
    });

    it("keeps changeAsync errors when dontValidate is enabled", async () => {
      vi.useFakeTimers();

      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          name: async ({ value }) => (value.length < 4 ? "Async error" : null),
        },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("name", "Joe");
      await vi.advanceTimersByTimeAsync(100);

      const errorMap1 = form.getFieldErrorMap("name");
      expect(errorMap1.change).toEqual([]);
      expect(errorMap1.changeAsync).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Async error",
          meta: {},
        },
      ]);

      form.setFieldValue("name", "Joel", { dontValidate: true });
      await vi.advanceTimersByTimeAsync(100);

      const errorMap2 = form.getFieldErrorMap("name");
      expect(errorMap2.change).toEqual([]);
      expect(errorMap2.changeAsync).toEqual([
        {
          path: "name",
          type: "changeAsync",
          message: "Async error",
          meta: {},
        },
      ]);

      vi.useRealTimers();
    });

    it("keeps change errors on all subFields when dontValidate is enabled", async () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          "profile.age": ({ value }: { value: number }) => (value < 18 ? "Too young" : null),
        },
      });

      form.setFieldValue("profile", { age: 16 });

      expect(form.getFieldErrorMap("profile.age").change).toEqual([
        {
          path: "profile.age",
          type: "change",
          message: "Too young",
          meta: {},
        },
      ]);

      form.setFieldValue("profile", { age: 20 }, { dontValidate: true });

      expect(form.getFieldErrorMap("profile.age").change).toEqual([
        {
          path: "profile.age",
          type: "change",
          message: "Too young",
          meta: {},
        },
      ]);
    });

    it("keeps changeAsync errors on all subFields when dontValidate is enabled", async () => {
      vi.useFakeTimers();

      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          "profile.age": async ({ value }: { value: number }) => (value < 21 ? "Too young" : null),
        },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("profile", { age: 16 });
      await vi.advanceTimersByTimeAsync(100);

      expect(form.getFieldErrorMap("profile.age").changeAsync).toEqual([
        {
          path: "profile.age",
          type: "changeAsync",
          message: "Too young",
          meta: {},
        },
      ]);

      form.setFieldValue("profile", { age: 24 }, { dontValidate: true });
      await vi.advanceTimersByTimeAsync(100);

      expect(form.getFieldErrorMap("profile.age").changeAsync).toEqual([
        {
          path: "profile.age",
          type: "changeAsync",
          message: "Too young",
          meta: {},
        },
      ]);
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

    it("notifies subscribers on nested subFields when setting a parent object", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          "profile.age": () => null,
        },
      });
      const profileAgeSubscriber = vi.fn();

      form.subscribeField("profile.age", profileAgeSubscriber);
      form.setFieldValue("profile", { age: 25 });

      expect(profileAgeSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 25,
        }),
      );
    });

    it("schedules async validation on nested subFields when setting a parent object", async () => {
      vi.useFakeTimers();

      const asyncValidator = vi.fn(async () => null);
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          "profile.age": asyncValidator,
        },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("profile", { age: 25 });
      await vi.advanceTimersByTimeAsync(100);

      expect(asyncValidator).toHaveBeenCalledWith({ value: 25, form });

      vi.useRealTimers();
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

    // ===== NOTIFY VALUE CHANGE =====

    it("notifies the value subscriber with value, oldValue, form, and default cause", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          name: subscriber,
        },
      });

      form.setFieldValue("name", "Jane");

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: "Jane",
        oldValue: "",
        form,
        cause: DEFAULT_CHANGE_CAUSE,
      });
    });

    it("notifies the value subscriber with the provided cause", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          name: subscriber,
        },
      });

      form.setFieldValue("name", "Jane", { cause: "user" });

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          cause: "user",
        }),
      );
    });

    it("does not notify when the field path cannot be set", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          name: subscriber,
        },
      });
      vi.spyOn(console, "error").mockImplementation(() => {});

      form.setFieldValue("profile.age.name" as "name", "invalid" as never);

      expect(subscriber).not.toHaveBeenCalled();
    });

    it("does not notify subscribers when set value of another field", () => {
      const nameSubscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          name: nameSubscriber,
        },
      });

      form.setFieldValue("email", "jane@example.com");

      expect(nameSubscriber).not.toHaveBeenCalled();
    });

    it("notifies nested subField value subscribers when setting a parent object", () => {
      const profileAgeSubscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          "profile.age": profileAgeSubscriber,
        },
      });

      form.setFieldValue("profile", { age: 25 });

      expect(profileAgeSubscriber).toHaveBeenCalledOnce();
      expect(profileAgeSubscriber).toHaveBeenCalledWith({
        value: 25,
        oldValue: 0,
        form,
        cause: DEFAULT_CHANGE_CAUSE,
      });
    });

    it("notifies each configured subField value subscriber when setting a parent object", () => {
      const profileSubscriber = vi.fn();
      const profileAgeSubscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          profile: profileSubscriber,
          "profile.age": profileAgeSubscriber,
        },
      });

      form.setFieldValue("profile", { age: 25 });

      expect(profileSubscriber).toHaveBeenCalledOnce();
      expect(profileSubscriber).toHaveBeenCalledWith({
        value: { age: 25 },
        oldValue: { age: 0 },
        form,
        cause: DEFAULT_CHANGE_CAUSE,
      });
      expect(profileAgeSubscriber).toHaveBeenCalledOnce();
      expect(profileAgeSubscriber).toHaveBeenCalledWith({
        value: 25,
        oldValue: 0,
        form,
        cause: DEFAULT_CHANGE_CAUSE,
      });
    });

    it("notifies value subscribers even when dontValidate is enabled", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          name: subscriber,
        },
      });

      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: "Jane",
        oldValue: "",
        form,
        cause: DEFAULT_CHANGE_CAUSE,
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
        form,
      });
    });

    it("calls onSubmit when no validators are registered", () => {
      const onSubmit = vi.fn();
      const form = new FormControl({ defaultValues, onSubmit });

      form.handleSubmit();

      expect(onSubmit).toHaveBeenCalledOnce();
      expect(onSubmit).toHaveBeenCalledWith({ values: defaultValues, form });
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
      expect(onSubmitFailed).toHaveBeenCalledWith({
        form,
        errors: {
          name: form.getFieldErrorMap("name"),
        },
      });
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
      expect(onSubmitFailed).toHaveBeenCalledWith({
        form,
        errors: {
          email: form.getFieldErrorMap("email"),
        },
      });
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
      expect(onSubmitFailed).toHaveBeenCalledWith({
        form,
        errors: {
          name: form.getFieldErrorMap("name"),
          email: form.getFieldErrorMap("email"),
        },
      });
    });

    it("does not pass field with no errors into errors argument of onSubmitFailed", () => {
      const onSubmitFailed = vi.fn();
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: ({ value }) => (value.length > 0 ? null : "Name is required"),
          email: () => "Email is required",
        },
        onSubmitFailed,
      });

      form.handleSubmit();
      onSubmitFailed.mockClear();
      form.setFieldValue("name", "Jane");
      form.handleSubmit();

      expect(onSubmitFailed).toHaveBeenCalledOnce();
      expect(onSubmitFailed).toHaveBeenCalledWith({
        form,
        errors: {
          email: form.getFieldErrorMap("email"),
          // no name error here
        },
      });
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
      expect(changeValidator.mock.calls).toEqual([[{ value: "", form }], [{ value: "", form }]]);

      expect(blurValidator).toHaveBeenCalledTimes(2);
      expect(blurValidator.mock.calls).toEqual([[{ value: "", form }], [{ value: 0, form }]]);
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
    });

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
      expect(onSubmit).toHaveBeenCalledWith({ values: defaultValues, form });

      vi.useRealTimers();
    });
  });

  describe("reset", () => {
    it("restores values to cloned default values", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("name", "Jane", { dontValidate: true });
      form.setFieldValue("profile.age", 25, { dontValidate: true });

      form.reset();

      expect(form.values).toEqual(defaultValues);
      expect(form.values).not.toBe(defaultValues);
      expect(form.values.profile).not.toBe(defaultValues.profile);
    });

    it("does not mutate default values when values change after reset", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("name", "Jane", { dontValidate: true });
      form.reset();
      form.setFieldValue("name", "Updated", { dontValidate: true });

      expect(form.getFieldValue("name")).toBe("Updated");
      expect(form._defaultValues.name).toBe("");
    });

    it("clears field meta and errors", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is required",
        },
      });

      form.setFieldValue("name", "");
      form.handleSubmit();

      form.reset();

      expect(form.getFieldMeta("name")).toEqual(DEFAULT_META);
      expect(form.getFieldErrorMap("name")).toEqual({
        change: [],
        blur: [],
        changeAsync: [],
        blurAsync: [],
      });
    });

    it("resets form meta to default including submit count", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is required",
        },
      });

      form.setFieldValue("name", "Jane", { dontValidate: true });
      form.handleSubmit();

      form.reset();

      expect(form.meta.get()).toEqual(DEFAULT_FORM_META);
    });

    it("notifies field subscribers with reset state", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: () => "Name is required",
        },
      });
      const subscriber = vi.fn();

      form.subscribeField("name", subscriber);
      form.setFieldValue("name", "Jane");
      subscriber.mockClear();

      form.reset();

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: "",
        meta: {
          isBlurred: false,
          isTouched: false,
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

    it("notifies meta subscribers with default form meta", () => {
      const form = new FormControl({ defaultValues });
      const subscriber = vi.fn();

      form.meta.subscribe(subscriber);
      form.setFieldValue("name", "Jane", { dontValidate: true });
      form.handleSubmit();
      subscriber.mockClear();

      form.reset();

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
        submitCount: 0,
      });
    });

    it("notifies value subscribers with default values", () => {
      const form = new FormControl({
        defaultValues,
      });
      const subscriber = vi.fn();

      form.subscribeFieldValue("name", subscriber);
      form.setFieldValue("name", "Jane");
      subscriber.mockClear();

      form.reset();

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          value: defaultValues.name,
        }),
      );
    });

    it("clears pending async validation timers", async () => {
      vi.useFakeTimers();

      const asyncValidator = vi.fn(async () => "Async error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          name: asyncValidator,
        },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("name", "Jane");
      form.reset();
      await vi.advanceTimersByTimeAsync(100);

      expect(asyncValidator).not.toHaveBeenCalled();
      expect(form.getFieldMeta("name").isValidating).toBe(false);

      vi.useRealTimers();
    });

    it("aborts in-flight async validation and clears validating state", async () => {
      vi.useFakeTimers();

      let resolveValidator: (value: string) => void = () => {};
      const asyncValidator = vi.fn(
        () =>
          new Promise<string>((resolve) => {
            resolveValidator = resolve;
          }),
      );
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          name: asyncValidator,
        },
        asyncDebounceMs: 100,
      });

      form.setFieldValue("name", "Jane");
      await vi.advanceTimersByTimeAsync(100);

      expect(form.getFieldMeta("name").isValidating).toBe(true);

      form.reset();
      resolveValidator("Async error");
      await Promise.resolve();

      expect(form.getFieldMeta("name").isValidating).toBe(false);
      expect(form.getFieldErrorMap("name").changeAsync).toEqual([]);

      vi.useRealTimers();
    });
  });
});
