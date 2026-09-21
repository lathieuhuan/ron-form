import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FieldArrayControl } from "../FieldArrayControl";
import { FormControl } from "../FormControl";
import { DEFAULT_META } from "../constants";

// TOCHECK

type FormValues = {
  contacts: Array<{
    name: string;
    phones: Array<{ number: string }>;
  }>;
};

const defaultValues: FormValues = {
  contacts: [
    { name: "A", phones: [{ number: "111" }] },
    { name: "B", phones: [{ number: "222" }] },
  ],
};

describe("field array identity", () => {
  it("moves metadata and rewrites error paths when items swap", () => {
    const form = new FormControl({ defaultValues });
    const fieldArray = new FieldArrayControl("contacts", form);

    form.setFieldMeta("contacts.0.name", {
      ...DEFAULT_META,
      isDirty: true,
      errors: {
        ...DEFAULT_META.errors,
        change: [
          {
            path: "contacts.0.name",
            type: "change",
            message: "A error",
            meta: {},
          },
        ],
      },
    });
    form.setFieldMeta("contacts.1.name", {
      ...DEFAULT_META,
      isTouched: true,
    });

    fieldArray.swap(0, 1, { dontValidate: true });

    expect(form.getFieldMeta("contacts.0.name")).toMatchObject({
      isTouched: true,
      isDirty: false,
    });
    expect(form.getFieldMeta("contacts.1.name")).toMatchObject({
      isDirty: true,
      errors: {
        change: [
          expect.objectContaining({
            path: "contacts.1.name",
            message: "A error",
          }),
        ],
      },
    });
  });

  it("gives inserted items fresh metadata and shifts existing metadata", () => {
    const form = new FormControl({ defaultValues });
    const fieldArray = new FieldArrayControl("contacts", form);

    form.setFieldMeta("contacts.0.name", {
      ...DEFAULT_META,
      isBlurred: true,
      isDirty: true,
    });

    fieldArray.insert({ name: "New", phones: [] }, 0, { dontValidate: true });

    expect(form.getFieldMeta("contacts.0.name")).toEqual(DEFAULT_META);
    expect(form.getFieldMeta("contacts.1.name")).toMatchObject({
      isBlurred: true,
      isDirty: true,
    });
  });

  it("preserves nested metadata when a parent item moves", () => {
    const form = new FormControl({ defaultValues });
    const fieldArray = new FieldArrayControl("contacts", form);

    form.setFieldMeta("contacts.0.phones.0.number", {
      ...DEFAULT_META,
      isTouched: true,
      isDirty: true,
    });

    fieldArray.move(0, 1, { dontValidate: true });

    expect(form.getFieldMeta("contacts.1.phones.0.number")).toMatchObject({
      isTouched: true,
      isDirty: true,
    });
    expect(form.getFieldMeta("contacts.0.phones.0.number")).toEqual(DEFAULT_META);
  });

  it("treats whole-array assignment as a full identity replacement", () => {
    const form = new FormControl({ defaultValues });

    form.setFieldMeta("contacts.0.name", {
      ...DEFAULT_META,
      isBlurred: true,
      errors: {
        ...DEFAULT_META.errors,
        blur: [
          {
            path: "contacts.0.name",
            type: "blur",
            message: "Old error",
            meta: {},
          },
        ],
      },
    });

    form.setFieldValue("contacts", [{ name: "Replacement", phones: [] }], { dontValidate: true });

    expect(form.getFieldMeta("contacts.0.name")).toMatchObject({
      isBlurred: false,
      isTouched: true,
      isDirty: true,
      errors: DEFAULT_META.errors,
    });
    expect(form.getFieldValue("contacts.1.name")).toBeUndefined();
    expect(form.getFieldMeta("contacts.1.name")).toEqual(DEFAULT_META);
  });

  it("clears array identities and metadata on reset", () => {
    const form = new FormControl({ defaultValues });

    form.setFieldMeta("contacts.0.name", {
      ...DEFAULT_META,
      isDirty: true,
    });
    form.reset();

    expect(form.getFieldMeta("contacts.0.name")).toEqual(DEFAULT_META);
  });

  describe("async validation", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("applies a pending result to the item's current index", async () => {
      let resolveValidator: (value: string | undefined) => void = () => {};
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          "contacts.[n].name": () =>
            new Promise<string | undefined>((resolve) => {
              resolveValidator = resolve;
            }),
        },
        asyncDebounceMs: 10,
      });
      const fieldArray = new FieldArrayControl("contacts", form);

      form.setFieldValue("contacts.0.name", "A changed");
      await vi.advanceTimersByTimeAsync(10);

      fieldArray.move(0, 1, { dontValidate: true });
      resolveValidator("Async error");
      await vi.runAllTimersAsync();

      expect(form.getFieldErrorMap("contacts.0.name").changeAsync).toEqual([]);
      expect(form.getFieldErrorMap("contacts.1.name").changeAsync).toEqual([
        expect.objectContaining({
          path: "contacts.1.name",
          message: "Async error",
        }),
      ]);
    });

    it("drops a pending result when its item is removed", async () => {
      let resolveValidator: (value: string | undefined) => void = () => {};
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          "contacts.[n].name": () =>
            new Promise<string | undefined>((resolve) => {
              resolveValidator = resolve;
            }),
        },
        asyncDebounceMs: 10,
      });
      const fieldArray = new FieldArrayControl("contacts", form);

      form.setFieldValue("contacts.0.name", "A changed");
      await vi.advanceTimersByTimeAsync(10);

      fieldArray.remove(0, { dontValidate: true });

      expect(form.runningValidatorMap.isAnyRunning()).toBe(false);
      expect(form.meta.get().isValidating).toBe(false);

      resolveValidator("Removed error");
      await vi.runAllTimersAsync();

      expect(form.getFieldErrorMap("contacts.0.name").changeAsync).toEqual([]);
      expect(form.runningValidatorMap.isAnyRunning()).toBe(false);
      expect(form.meta.get().isValidating).toBe(false);
    });

    it("cancels the old run after an item moves and is validated again", async () => {
      let resolveFirstValidator: (value: string | undefined) => void = () => {};
      const firstValidator = vi.fn(
        () =>
          new Promise<string | undefined>((resolve) => {
            resolveFirstValidator = resolve;
          }),
      );
      const secondValidator = vi.fn(async () => "Latest error");
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: {
          "contacts.[n].name": firstValidator,
        },
        asyncDebounceMs: 10,
      });
      const fieldArray = new FieldArrayControl("contacts", form);

      form.setFieldValue("contacts.0.name", "First value");
      await vi.advanceTimersByTimeAsync(10);

      fieldArray.move(0, 1, { dontValidate: true });
      form.asyncValidators.change["contacts.[n].name"] = secondValidator;
      form.setFieldValue("contacts.1.name", "Latest value");
      await vi.advanceTimersByTimeAsync(10);

      resolveFirstValidator("Stale error");
      await vi.runAllTimersAsync();

      expect(secondValidator).toHaveBeenCalledOnce();
      expect(form.getFieldErrorMap("contacts.1.name").changeAsync).toEqual([
        expect.objectContaining({
          path: "contacts.1.name",
          message: "Latest error",
        }),
      ]);
    });
  });
});
