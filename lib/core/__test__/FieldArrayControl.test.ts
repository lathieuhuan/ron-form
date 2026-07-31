import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FieldArrayControl } from "../FieldArrayControl";
import { FormControl } from "../FormControl";
import { DEFAULT_CHANGE_CAUSE } from "../constants";
import * as objectUtils from "../utils/object";

type FormValues = {
  tags: string[];
  contacts: { name: string; email: string }[];
  notArray: string;
};

const defaultValues: FormValues = {
  tags: [],
  contacts: [],
  notArray: "",
};

describe("FieldArrayControl", () => {
  describe("constructor", () => {
    it("stores the form and field name", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      expect(fieldArray.form).toBe(form);
      expect(fieldArray.name).toBe("tags");
    });
  });

  describe("value", () => {
    it("returns the current array value from the form", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a", "b"], { dontValidate: true });

      expect(fieldArray.value).toEqual(["a", "b"]);
    });
  });

  describe("insert", () => {
    it("appends to the end when index is omitted", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a"], { dontValidate: true });

      const result = fieldArray.insert("b", undefined, { dontValidate: true });

      expect(result).toEqual(["a", "b"]);
      expect(form.getFieldValue("tags")).toEqual(["a", "b"]);
    });

    it("inserts at the specified index", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a", "c"], { dontValidate: true });

      const result = fieldArray.insert("b", 1, { dontValidate: true });

      expect(result).toEqual(["a", "b", "c"]);
      expect(form.getFieldValue("tags")).toEqual(["a", "b", "c"]);
    });

    it("initializes an empty array when the field value is null or undefined", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      (form._values as { tags: string[] | null }).tags = null;

      const nullResult = fieldArray.insert("first", undefined, { dontValidate: true });

      expect(nullResult).toEqual(["first"]);
      expect(form.getFieldValue("tags")).toEqual(["first"]);

      (form._values as { tags: string[] | undefined }).tags = undefined;

      const undefinedResult = fieldArray.insert("second", undefined, { dontValidate: true });

      expect(undefinedResult).toEqual(["second"]);
      expect(form.getFieldValue("tags")).toEqual(["second"]);
    });

    it("returns null when the current value is not an array", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("notArray", form);

      const result = fieldArray.insert("value" as never, undefined, { dontValidate: true });

      expect(result).toBeNull();
      expect(form.getFieldValue("notArray")).toBe("");
    });

    it("returns null when the index is out of bounds", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a"], { dontValidate: true });

      expect(fieldArray.insert("b", -1, { dontValidate: true })).toBeNull();
      expect(fieldArray.insert("b", 2, { dontValidate: true })).toBeNull();
      expect(form.getFieldValue("tags")).toEqual(["a"]);
    });

    it("returns null when the field path cannot be set", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);
      const setSpy = vi.spyOn(objectUtils, "set").mockReturnValue(false);

      const result = fieldArray.insert("a", undefined, { dontValidate: true });

      expect(result).toBeNull();
      setSpy.mockRestore();
    });

    it("notifies the array field value subscriber when dontValidate is enabled", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          tags: subscriber,
        },
      });
      const fieldArray = new FieldArrayControl("tags", form);

      fieldArray.insert("a", undefined, { dontValidate: true });

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: ["a"],
        oldValue: ["a"],
        form,
        cause: DEFAULT_CHANGE_CAUSE,
      });
    });

    it("notifies nested field subscribers when inserting an object item with dontValidate", () => {
      const nameSubscriber = vi.fn();
      const emailSubscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          "contacts.0.name": nameSubscriber,
          "contacts.0.email": emailSubscriber,
        },
      });
      const fieldArray = new FieldArrayControl("contacts", form);

      fieldArray.insert({ name: "Jane", email: "jane@example.com" }, undefined, {
        dontValidate: true,
      });

      expect(nameSubscriber).toHaveBeenCalledOnce();
      expect(emailSubscriber).toHaveBeenCalledOnce();
    });

    it("marks the array field as touched and dirty by default", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      fieldArray.insert("a");

      expect(form.getFieldMeta("tags")).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    it("runs change validators on the array field", () => {
      const validator = vi.fn(() => "At least one tag is required");
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          tags: validator,
        },
      });
      const fieldArray = new FieldArrayControl("tags", form);

      fieldArray.insert("a");

      expect(validator).toHaveBeenCalledWith({
        value: ["a"],
        form,
      });
      expect(form.getFieldErrorMap("tags").change).toEqual([
        {
          path: "tags",
          type: "change",
          message: "At least one tag is required",
          meta: {},
        },
      ]);
    });

    it("notifies the array field value subscriber after validation", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          tags: subscriber,
        },
      });
      const fieldArray = new FieldArrayControl("tags", form);

      fieldArray.insert("a");

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: ["a"],
        oldValue: [],
        form,
        cause: DEFAULT_CHANGE_CAUSE,
      });
    });

    it("respects a custom cause option", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          tags: subscriber,
        },
      });
      const fieldArray = new FieldArrayControl("tags", form);

      fieldArray.insert("a", undefined, { dontValidate: true, cause: "user" });

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          cause: "user",
        }),
      );
    });

    describe("async validation", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("schedules async validation when sync validation passes", async () => {
        const asyncValidator = vi.fn(async () => "Async error");
        const form = new FormControl({
          defaultValues,
          changeAsyncValidators: {
            tags: asyncValidator,
          },
          asyncDebounceMs: 100,
        });
        const fieldArray = new FieldArrayControl("tags", form);

        fieldArray.insert("a");

        expect(asyncValidator).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(100);

        expect(asyncValidator).toHaveBeenCalledWith({
          value: ["a"],
          form,
        });
      });

      it("does not schedule async validation when sync validation fails", async () => {
        const asyncValidator = vi.fn(async () => "Async error");
        const form = new FormControl({
          defaultValues,
          changeValidators: {
            tags: () => "Sync error",
          },
          changeAsyncValidators: {
            tags: asyncValidator,
          },
          asyncDebounceMs: 100,
        });
        const fieldArray = new FieldArrayControl("tags", form);

        fieldArray.insert("a");
        await vi.advanceTimersByTimeAsync(100);

        expect(asyncValidator).not.toHaveBeenCalled();
      });
    });
  });

  describe("remove", () => {
    it("removes the item at the specified index", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a", "b", "c"], { dontValidate: true });

      const result = fieldArray.remove(1, { dontValidate: true });

      expect(result).toEqual(["a", "c"]);
      expect(form.getFieldValue("tags")).toEqual(["a", "c"]);
    });

    it("removes the first item", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a", "b"], { dontValidate: true });

      const result = fieldArray.remove(0, { dontValidate: true });

      expect(result).toEqual(["b"]);
      expect(form.getFieldValue("tags")).toEqual(["b"]);
    });

    it("removes the last item", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a", "b"], { dontValidate: true });

      const result = fieldArray.remove(1, { dontValidate: true });

      expect(result).toEqual(["a"]);
      expect(form.getFieldValue("tags")).toEqual(["a"]);
    });

    it("returns null when the current value is not an array", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("notArray", form);

      const result = fieldArray.remove(0, { dontValidate: true });

      expect(result).toBeNull();
      expect(form.getFieldValue("notArray")).toBe("");
    });

    it("returns null when the index is out of bounds", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a"], { dontValidate: true });

      expect(fieldArray.remove(-1, { dontValidate: true })).toBeNull();
      expect(fieldArray.remove(1, { dontValidate: true })).toBeNull();
      expect(form.getFieldValue("tags")).toEqual(["a"]);
    });

    it("returns null when the field path cannot be set", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);
      const setSpy = vi.spyOn(objectUtils, "set").mockReturnValue(false);

      form.setFieldValue("tags", ["a"], { dontValidate: true });

      const result = fieldArray.remove(0, { dontValidate: true });

      expect(result).toBeNull();
      setSpy.mockRestore();
    });

    it("notifies the array field value subscriber when dontValidate is enabled", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          tags: subscriber,
        },
      });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a", "b"], { dontValidate: true });
      subscriber.mockClear();

      fieldArray.remove(1, { dontValidate: true });

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: ["a"],
        oldValue: ["a"],
        form,
        cause: DEFAULT_CHANGE_CAUSE,
      });
    });

    it("notifies nested field subscribers when removing an object item with dontValidate", () => {
      const nameSubscriber = vi.fn();
      const emailSubscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          "contacts.0.name": nameSubscriber,
          "contacts.0.email": emailSubscriber,
        },
      });
      const fieldArray = new FieldArrayControl("contacts", form);

      form.setFieldValue(
        "contacts",
        [{ name: "Jane", email: "jane@example.com" }],
        { dontValidate: true },
      );

      fieldArray.remove(0, { dontValidate: true });

      expect(nameSubscriber).toHaveBeenCalledOnce();
      expect(emailSubscriber).toHaveBeenCalledOnce();
    });

    it("marks the array field as touched and dirty by default", () => {
      const form = new FormControl({ defaultValues });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a", "b"], { dontValidate: true });

      fieldArray.remove(0);

      expect(form.getFieldMeta("tags")).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    it("runs change validators on the array field", () => {
      const validator = vi.fn(() => "At least one tag is required");
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          tags: validator,
        },
      });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a"], { dontValidate: true });

      fieldArray.remove(0);

      expect(validator).toHaveBeenCalledWith({
        value: [],
        form,
      });
      expect(form.getFieldErrorMap("tags").change).toEqual([
        {
          path: "tags",
          type: "change",
          message: "At least one tag is required",
          meta: {},
        },
      ]);
    });

    it("notifies the array field value subscriber after validation", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          tags: subscriber,
        },
      });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a", "b"], { dontValidate: true });
      subscriber.mockClear();

      fieldArray.remove(1);

      expect(subscriber).toHaveBeenCalledOnce();
      expect(subscriber).toHaveBeenCalledWith({
        value: ["a"],
        oldValue: ["a", "b"],
        form,
        cause: DEFAULT_CHANGE_CAUSE,
      });
    });

    it("respects a custom cause option", () => {
      const subscriber = vi.fn();
      const form = new FormControl({
        defaultValues,
        valueSubscribers: {
          tags: subscriber,
        },
      });
      const fieldArray = new FieldArrayControl("tags", form);

      form.setFieldValue("tags", ["a", "b"], { dontValidate: true });
      subscriber.mockClear();

      fieldArray.remove(1, { dontValidate: true, cause: "user" });

      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          cause: "user",
        }),
      );
    });

    describe("async validation", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("schedules async validation when sync validation passes", async () => {
        const asyncValidator = vi.fn(async () => "Async error");
        const form = new FormControl({
          defaultValues,
          changeAsyncValidators: {
            tags: asyncValidator,
          },
          asyncDebounceMs: 100,
        });
        const fieldArray = new FieldArrayControl("tags", form);

        form.setFieldValue("tags", ["a"], { dontValidate: true });

        fieldArray.remove(0);

        expect(asyncValidator).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(100);

        expect(asyncValidator).toHaveBeenCalledWith({
          value: [],
          form,
        });
      });

      it("does not schedule async validation when sync validation fails", async () => {
        const asyncValidator = vi.fn(async () => "Async error");
        const form = new FormControl({
          defaultValues,
          changeValidators: {
            tags: () => "Sync error",
          },
          changeAsyncValidators: {
            tags: asyncValidator,
          },
          asyncDebounceMs: 100,
        });
        const fieldArray = new FieldArrayControl("tags", form);

        form.setFieldValue("tags", ["a"], { dontValidate: true });

        fieldArray.remove(0);
        await vi.advanceTimersByTimeAsync(100);

        expect(asyncValidator).not.toHaveBeenCalled();
      });
    });
  });
});
