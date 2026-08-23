import { afterEach, beforeEach, describe, expect, it, test, vi } from "vitest";
import { FieldControl } from "../FieldControl";
import { FormControl } from "../FormControl";
import { FieldMeta } from "../types";
import { delay } from "../utils/delay";

const defaultValues = {
  name: "John",
  email: "john@example.com",
  profile: {
    age: 30,
  },
};

describe("FieldControl", () => {
  describe("constructor", () => {
    it("stores the form and field name", () => {
      const form = new FormControl({ defaultValues });
      const field = new FieldControl(form, "name");

      expect(field.form).toBe(form);
      expect(field.name).toBe("name");
    });
  });

  describe("handleChange", () => {
    it("updates the field value through the form", () => {
      const form = new FormControl({ defaultValues });
      const field = new FieldControl(form, "name");

      field.handleChange("Jane");

      expect(form.getFieldValue("name")).toBe("Jane");
    });

    it("updates nested field values", () => {
      const form = new FormControl({ defaultValues });
      const field = new FieldControl(form, "profile.age");

      field.handleChange(25);

      expect(form.getFieldValue("profile.age")).toBe(25);
    });

    it("marks the field as touched and dirty", () => {
      const form = new FormControl({ defaultValues });
      const field = new FieldControl(form, "name");

      field.handleChange("Jane");

      expect(form.getFieldMeta("name")).toEqual({
        isBlurred: false,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    it("runs change validators", () => {
      const validator = vi.fn(() => "Name is required");
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: validator },
      });
      const field = new FieldControl(form, "name");

      field.handleChange("");

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
  });

  describe("handleBlur", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe("blurred and touched state", () => {
      test("when field is not blurred, it marks the field as blurred and touched, notifies field and form subscribers", () => {
        const form = new FormControl({ defaultValues });
        const field = new FieldControl(form, "name");

        form.fieldMetaMap.set("name", {
          ...form.getFieldMeta("name"),
          isBlurred: false,
          isTouched: true,
        });

        const formSubscriber = vi.fn();
        const fieldSubscriber = vi.fn();

        form.meta.subscribe(formSubscriber);
        form.subscribeField("name", fieldSubscriber);

        field.handleBlur();

        const newMeta: FieldMeta = {
          isBlurred: true,
          isTouched: true,
          isDirty: false,
          isValidating: false,
        };

        expect(form.getFieldMeta("name")).toEqual(newMeta);
        expect(formSubscriber).toHaveBeenCalledOnce();
        expect(fieldSubscriber).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({ meta: newMeta }),
        );
      });

      test("when field is not touched, it marks the field as blurred and touched, notifies field and form subscribers", () => {
        const form = new FormControl({ defaultValues });
        const field = new FieldControl(form, "name");

        form.fieldMetaMap.set("name", {
          ...form.getFieldMeta("name"),
          isBlurred: true,
          isTouched: false,
        });

        const formSubscriber = vi.fn();
        const fieldSubscriber = vi.fn();

        form.meta.subscribe(formSubscriber);
        form.subscribeField("name", fieldSubscriber);

        field.handleBlur();

        const newMeta: FieldMeta = {
          isBlurred: true,
          isTouched: true,
          isDirty: false,
          isValidating: false,
        };

        expect(form.getFieldMeta("name")).toEqual(newMeta);
        expect(formSubscriber).toHaveBeenCalledOnce();
        expect(fieldSubscriber).toHaveBeenCalledExactlyOnceWith(
          expect.objectContaining({ meta: newMeta }),
        );
      });

      it("preserves other meta when marking as blurred and touched", async () => {
        const form = new FormControl({
          defaultValues,
          changeAsyncValidators: {
            name: async () => {
              await delay(100);
              return "Async error";
            },
          },
          asyncDebounceMs: 100,
        });
        const field = new FieldControl(form, "name");

        form.setFieldValue("name", "Jane");
        await vi.advanceTimersByTimeAsync(100);

        field.handleBlur();

        expect(form.getFieldMeta("name")).toEqual({
          isBlurred: true,
          isTouched: true,
          isDirty: true,
          isValidating: true,
        });
      });
    });

    describe("sync validation", () => {
      it("runs blur validators and stores errors", () => {
        const validator = vi.fn(() => "Email is required");
        const form = new FormControl({
          defaultValues,
          blurValidators: { email: validator },
        });
        const field = new FieldControl(form, "email");

        field.handleBlur();

        expect(validator).toHaveBeenCalledWith({ value: "john@example.com", form });
        expect(form.getFieldErrorMap("email").blur).toEqual([
          {
            path: "email",
            type: "blur",
            message: "Email is required",
            meta: {},
          },
        ]);
      });
    });

    describe("async validation", () => {
      it("runs blur async validators after debounce when sync validation passes", async () => {
        const asyncValidator = vi.fn(async () => "Async blur error");
        const form = new FormControl({
          defaultValues,
          blurAsyncValidators: { name: asyncValidator },
          asyncDebounceMs: 100,
        });
        const field = new FieldControl(form, "name");

        field.handleBlur();

        expect(asyncValidator).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(100);

        expect(asyncValidator).toHaveBeenCalledWith({ value: "John", form });
        expect(form.getFieldErrorMap("name").blurAsync).toEqual([
          {
            path: "name",
            type: "blurAsync",
            message: "Async blur error",
            meta: {},
          },
        ]);
      });

      it("does not run blur async validation when sync validation fails", async () => {
        const asyncValidator = vi.fn(async () => "Async blur error");
        const form = new FormControl({
          defaultValues,
          blurValidators: { name: () => "Sync error" },
          blurAsyncValidators: { name: asyncValidator },
          asyncDebounceMs: 100,
        });
        const field = new FieldControl(form, "name");

        field.handleBlur();
        await vi.advanceTimersByTimeAsync(100);

        expect(asyncValidator).not.toHaveBeenCalled();
      });

      it("does not run blur async validation when no validator is registered", async () => {
        const form = new FormControl({ defaultValues });
        const field = new FieldControl(form, "name");
        const validateAsync = vi.spyOn(form, "validateAsync");

        field.handleBlur();
        await vi.advanceTimersByTimeAsync(300);

        expect(validateAsync).not.toHaveBeenCalled();
      });
    });

    describe("cleanup", () => {
      it("aborts the previous blur async validation on subsequent blur", async () => {
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
          blurAsyncValidators: { name: firstValidator },
          asyncDebounceMs: 100,
        });
        const field = new FieldControl(form, "name");

        field.handleBlur();
        await vi.advanceTimersByTimeAsync(100);

        expect(firstValidator).toHaveBeenCalledOnce();
        expect(form.getFieldMeta("name").isValidating).toBe(true);

        form.asyncValidators.blur.name = secondValidator;
        field.handleBlur();
        await vi.advanceTimersByTimeAsync(100);

        resolveFirstValidator("First error");
        await vi.runAllTimersAsync();

        expect(secondValidator).toHaveBeenCalledOnce();
        expect(form.getFieldErrorMap("name").blurAsync).toEqual([
          {
            path: "name",
            type: "blurAsync",
            message: "Second error",
            meta: {},
          },
        ]);
      });

      it("clears pending debounced blur validation on subsequent blur", async () => {
        const asyncValidator = vi.fn(async () => "Async blur error");
        const form = new FormControl({
          defaultValues,
          blurAsyncValidators: { name: asyncValidator },
          asyncDebounceMs: 100,
        });
        const field = new FieldControl(form, "name");

        field.handleBlur();
        await vi.advanceTimersByTimeAsync(50);
        field.handleBlur();
        await vi.advanceTimersByTimeAsync(100);

        expect(asyncValidator).toHaveBeenCalledOnce();
      });
    });

    describe("form meta", () => {
      it("updates form meta after blur", () => {
        const form = new FormControl({ defaultValues });
        const field = new FieldControl(form, "name");

        field.handleBlur();

        expect(form.meta.get().isTouched).toBe(true);
      });
    });

    // PERFORMANCE TESTS

    describe("should not notify field or form subscribers", () => {
      test("when field is already blurred and touched, no blur sync or async validator", () => {
        const form = new FormControl({ defaultValues });
        const field = new FieldControl(form, "name");
        const formSubscriber = vi.fn();
        const fieldSubscriber = vi.fn();

        field.handleBlur();

        form.meta.subscribe(formSubscriber);
        form.subscribeField("name", fieldSubscriber);

        field.handleBlur();

        expect(formSubscriber).not.toHaveBeenCalled();
        expect(fieldSubscriber).not.toHaveBeenCalled();
      });

      test("when field is already blurred and touched, no blur async validator, has blur sync validator but no errors", () => {
        const form = new FormControl({
          defaultValues,
          blurValidators: { name: () => null },
        });
        const field = new FieldControl(form, "name");
        const formSubscriber = vi.fn();
        const fieldSubscriber = vi.fn();

        field.handleBlur();

        form.meta.subscribe(formSubscriber);
        form.subscribeField("name", fieldSubscriber);

        field.handleBlur();

        expect(formSubscriber).not.toHaveBeenCalled();
        expect(fieldSubscriber).not.toHaveBeenCalled();
      });
    });
  });
});
