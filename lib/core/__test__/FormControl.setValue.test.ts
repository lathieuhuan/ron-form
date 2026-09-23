import { describe, expect, it, vi } from "vitest";
import { FormControl } from "../FormControl";
import { DEFAULT_CHANGE_CAUSE, DEFAULT_META } from "../constants";

const defaultValues = {
  name: "",
  email: "",
  profile: {
    age: 0,
  },
  links: ["https://abc.com", "https://xyz.com"],
};

describe("FormControl setFieldValue", () => {
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

  describe("update meta of related fields", () => {
    it("marks the field as touched and dirty by default", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("name", "Jane", { dontValidate: true });

      expect(form.getFieldMeta("name")).toEqual({
        ...DEFAULT_META,
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    // it("marks parent fields as touched and dirty when setting a nested value", () => {
    //   const form = new FormControl({ defaultValues });

    //   form.setFieldValue("profile.age", 25, { dontValidate: true });

    //   expect(form.getFieldMeta("profile")).toEqual({
    //     ...DEFAULT_META,
    //     isBlurred: false,
    //     isTouched: true,
    //     isDirty: true,
    //     isValidating: false,
    //   });
    // });

    it("marks nested sub fields as touched and dirty when setting an object value", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldValue("profile", { age: 25 }, { dontValidate: true });

      expect(form.getFieldMeta("profile.age")).toEqual({
        ...DEFAULT_META,
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    it("respects dontTouch and dontDirty options", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldMeta("name", {
        ...form.getFieldMeta("name"),
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
        ...DEFAULT_META,
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
    });

    it("respects dontTouch and dontDirty options on nested subFields", () => {
      const form = new FormControl({ defaultValues });

      form.setFieldMeta("profile", {
        ...form.getFieldMeta("profile"),
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
      form.setFieldMeta("profile.age", {
        ...form.getFieldMeta("profile.age"),
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
        ...DEFAULT_META,
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
      expect(form.getFieldMeta("profile.age")).toEqual({
        ...DEFAULT_META,
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
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

    expect(validator).toHaveBeenCalledWith("", form);
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
    const profileAgeValidator = vi.fn((value: number) => (value < 18 ? "Must be 18+" : null));
    const form = new FormControl({
      defaultValues,
      changeValidators: {
        "profile.age": profileAgeValidator,
      },
    });

    form.setFieldValue("profile", { age: 16 });

    expect(profileAgeValidator).toHaveBeenCalledWith(16, form);
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
        name: (value) => (value.length < 3 ? "Error" : null),
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
        name: async (value) => (value.length < 4 ? "Async error" : null),
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
        "profile.age": (value) => (value < 18 ? "Too young" : null),
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
        "profile.age": async (value) => (value < 21 ? "Too young" : null),
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

    expect(asyncValidator).toHaveBeenCalledWith(25, form);

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
