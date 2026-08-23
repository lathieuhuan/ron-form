import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormControl } from "../FormControl";
import { FieldError } from "../types";

const defaultValues = {
  name: "John",
  email: "john@example.com",
  profile: {
    age: 30,
  },
};

describe("FormControl validation", () => {
  describe("_validateAsync", () => {
    it("returns immediately when no async validator is registered", async () => {
      const form = new FormControl({ defaultValues });
      const updateAndNotifyField = vi.spyOn(form, "updateAndNotifyField");

      const validationSpec = form.asyncValidationSpec("change", "name");
      const errors = await form._validateAsync(validationSpec, new AbortController());

      expect(errors).toEqual([]);
      expect(updateAndNotifyField).not.toHaveBeenCalled();
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

      const validationSpec = form.asyncValidationSpec("change", "name");
      await form._validateAsync(validationSpec, new AbortController());

      expect(validator).toHaveBeenCalledWith("John", form);
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

      const validationSpec = form.asyncValidationSpec("change", "name");
      await form._validateAsync(validationSpec, new AbortController());

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

      const validationSpec = form.asyncValidationSpec("change", "name");
      const validation = form._validateAsync(validationSpec, abortCtrl);
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
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });

      const validationSpec = form.asyncValidationSpec("change", "name");
      const errors = await form._validateAsync(validationSpec, new AbortController());

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
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      const validationSpec = form.asyncValidationSpec("change", "name");
      const validation = form._validateAsync(validationSpec, new AbortController());

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
      const form = new FormControl({
        defaultValues,
        blurAsyncValidators: { email: validator },
      });

      const validationSpec = form.asyncValidationSpec("blur", "email");
      const errors = await form._validateAsync(validationSpec, new AbortController());

      expect(validator).toHaveBeenCalledWith("john@example.com", form);
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

      const validationSpec = form.asyncValidationSpec("change", "name");
      const errors = await form._validateAsync(validationSpec, new AbortController());

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

      const validationSpec = form.asyncValidationSpec("change", "name");
      await form._validateAsync(validationSpec, new AbortController());

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
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: validator },
      });

      const validationSpec = form.asyncValidationSpec("change", "name");
      const errors = await form._validateAsync(validationSpec, new AbortController());

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
      const form = new FormControl({
        defaultValues,
        changeAsyncValidators: { name: changeValidator },
        blurAsyncValidators: { name: blurValidator },
      });

      const changeValidationSpec = form.asyncValidationSpec("change", "name");
      const changeValidation = form._validateAsync(changeValidationSpec, new AbortController());

      const blurValidationSpec = form.asyncValidationSpec("blur", "name");
      const blurValidation = form._validateAsync(blurValidationSpec, new AbortController());

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

  describe("_validateSync", () => {
    it("returns empty errors when no sync validator is registered", () => {
      const form = new FormControl({ defaultValues });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      const validationSpec = form.validationSpec("change", "name");
      const { meta, errors, errorMap } = form._validateSync(validationSpec, {
        shouldBlur: false,
        shouldTouch: false,
        shouldDirty: false,
      });

      expect(errors).toEqual([]);
      expect(errorMap.change).toEqual([]);
      expect(meta).toEqual({
        isBlurred: false,
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
      expect(fieldSubscriber).not.toHaveBeenCalled();
    });

    it("validates with the current field value and returns sync errors", () => {
      const validator = vi.fn(() => "Name is required");
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: validator },
      });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      const validationSpec = form.validationSpec("change", "name");
      const { errors, errorMap } = form._validateSync(validationSpec, {
        shouldBlur: false,
        shouldTouch: false,
        shouldDirty: false,
      });

      const expectedErrors = [
        {
          path: "name",
          type: "change",
          message: "Name is required",
          meta: {},
        },
      ];

      expect(validator).toHaveBeenCalledWith("John", form);
      expect(errors).toEqual(expectedErrors);
      expect(errorMap.change).toEqual(expectedErrors);
      expect(form.getFieldErrorMap("name").change).toEqual([]);
      expect(fieldSubscriber).not.toHaveBeenCalled();
    });

    it("validates with blur validators when cause is blur", () => {
      const validator = vi.fn(() => "Email is invalid");
      const form = new FormControl({
        defaultValues,
        blurValidators: { email: validator },
      });

      const validationSpec = form.validationSpec("blur", "email");
      const { errors, errorMap } = form._validateSync(validationSpec, {
        shouldBlur: false,
        shouldTouch: false,
        shouldDirty: false,
      });

      const expectedErrors = [
        {
          path: "email",
          type: "blur",
          message: "Email is invalid",
          meta: {},
        },
      ];

      expect(validator).toHaveBeenCalledWith("john@example.com", form);
      expect(errors).toEqual(expectedErrors);
      expect(errorMap.blur).toEqual(expectedErrors);
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

      const validationSpec = form.validationSpec("change", "name");
      const { errors, errorMap } = form._validateSync(validationSpec, {
        shouldBlur: false,
        shouldTouch: false,
        shouldDirty: false,
      });

      expect(errors).toEqual([]);
      expect(errorMap.change).toEqual([]);
      expect(form.getFieldErrorMap("name").change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Existing error",
          meta: {},
        },
      ]);
    });

    it("preserves errors for other causes", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: () => "Change error" },
      });

      const blurErrors: FieldError<"name">[] = [
        {
          path: "name",
          type: "blur",
          message: "Blur error",
          meta: {},
        },
      ];

      form.fieldErrorMap.set("name", {
        change: [],
        blur: blurErrors,
        changeAsync: [],
        blurAsync: [],
      });

      const validationSpec = form.validationSpec("change", "name");
      const { errorMap } = form._validateSync(validationSpec, {
        shouldBlur: false,
        shouldTouch: false,
        shouldDirty: false,
      });

      expect(errorMap.change).toEqual([
        {
          path: "name",
          type: "change",
          message: "Change error",
          meta: {},
        },
      ]);
      expect(errorMap.blur).toEqual(blurErrors);
    });

    it("returns isTouched in meta when shouldTouch is true", () => {
      const form = new FormControl({ defaultValues });

      const validationSpec = form.validationSpec("change", "name");
      const { meta } = form._validateSync(validationSpec, {
        shouldBlur: false,
        shouldTouch: true,
        shouldDirty: false,
      });

      expect(meta.isTouched).toBe(true);
      expect(form.getFieldMeta("name").isTouched).toBe(false);
    });

    it("returns isBlurred in meta when shouldBlur is true", () => {
      const form = new FormControl({ defaultValues });

      const validationSpec = form.validationSpec("change", "name");
      const { meta } = form._validateSync(validationSpec, {
        shouldBlur: true,
        shouldTouch: false,
        shouldDirty: false,
      });

      expect(meta.isBlurred).toBe(true);
      expect(form.getFieldMeta("name").isBlurred).toBe(false);
    });

    it("does not override existing touched or blurred meta", () => {
      const form = new FormControl({ defaultValues });

      form.fieldMetaMap.set("name", {
        isBlurred: true,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });

      const validationSpec = form.validationSpec("change", "name");
      const { meta } = form._validateSync(validationSpec, {
        shouldTouch: true,
        shouldBlur: true,
        shouldDirty: false,
      });

      expect(meta).toEqual({
        isBlurred: true,
        isTouched: true,
        isDirty: true,
        isValidating: false,
      });
    });

    // PERFORMANCE TESTS

    it("should return current meta and errorMap when no changes", () => {
      const form = new FormControl({ defaultValues });
      const fieldSubscriber = vi.fn();

      form.subscribeField("name", fieldSubscriber);

      const validationSpec = form.validationSpec("change", "name");
      const { meta, errorMap } = form._validateSync(validationSpec, {
        shouldBlur: false,
        shouldTouch: false,
        shouldDirty: false,
      });

      expect(meta).toEqual(form.getFieldMeta("name"));
      expect(errorMap).toEqual(form.getFieldErrorMap("name"));
      expect(fieldSubscriber).not.toHaveBeenCalled();
    });
  });

  describe("_runSyncValidator", () => {
    it("returns an empty array when no sync validator is registered", () => {
      const form = new FormControl({ defaultValues });

      const validationSpec = form.validationSpec("change", "name");
      const errors = form._runSyncValidator(validationSpec);

      expect(errors).toEqual([]);
    });

    it("validates with the current field value by default", () => {
      const validator = vi.fn(() => undefined);
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: validator },
      });

      const validationSpec = form.validationSpec("change", "name");
      form._runSyncValidator(validationSpec);

      expect(validator).toHaveBeenCalledWith("John", form);
    });

    it("validates with the provided value when passed explicitly", () => {
      const validator = vi.fn(() => undefined);
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: validator },
      });

      const validationSpec = form.validationSpec("change", "name", "");
      form._runSyncValidator(validationSpec);

      expect(validator).toHaveBeenCalledWith("", form);
    });

    it("validates with blur validators when cause is blur", () => {
      const validator = vi.fn(() => "Email is invalid");
      const form = new FormControl({
        defaultValues,
        blurValidators: { email: validator },
      });

      const validationSpec = form.validationSpec("blur", "email");
      const errors = form._runSyncValidator(validationSpec);

      expect(validator).toHaveBeenCalledWith("john@example.com", form);
      expect(errors).toEqual([
        {
          path: "email",
          type: "blur",
          message: "Email is invalid",
          meta: {},
        },
      ]);
    });

    it("returns an empty array when the validator returns undefined", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: { name: () => undefined },
      });

      const validationSpec = form.validationSpec("change", "name");
      const errors = form._runSyncValidator(validationSpec);

      expect(errors).toEqual([]);
    });

    it("runs wildcard validators for matching array item paths", () => {
      const arrayDefaultValues = {
        contacts: [{ name: "Alice" }, { name: "Bob" }],
      };
      const validator = vi.fn(() => "Name is required");
      const form = new FormControl({
        defaultValues: arrayDefaultValues,
        changeValidators: {
          "contacts.[n].name": validator,
        },
      });

      const validationSpec = form.validationSpec("change", "contacts.0.name");
      const errors = form._runSyncValidator(validationSpec);

      expect(validator).toHaveBeenCalledWith("Alice", form);
      expect(errors).toEqual([
        {
          path: "contacts.0.name",
          type: "change",
          message: "Name is required",
          meta: {},
        },
      ]);
    });

    it("does not run validators that do not match the field path", () => {
      const nameValidator = vi.fn(() => "Name error");
      const emailValidator = vi.fn(() => "Email error");
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          name: nameValidator,
          email: emailValidator,
        },
      });

      const validationSpec = form.validationSpec("change", "name");
      const errors = form._runSyncValidator(validationSpec);

      expect(nameValidator).toHaveBeenCalledOnce();
      expect(emailValidator).not.toHaveBeenCalled();
      expect(errors).toEqual([
        {
          path: "name",
          type: "change",
          message: "Name error",
          meta: {},
        },
      ]);
    });
  });

  describe("validateSync", () => {
    it("sets isTouched on field and form meta when shouldTouch is true", () => {
      const form = new FormControl({ defaultValues });

      form.validateSync("name", "change", { shouldTouch: true });

      expect(form.meta.get().isTouched).toBe(true);
    });

    it("sets isBlurred on field and form meta when shouldBlur is true", () => {
      const form = new FormControl({ defaultValues });

      form.validateSync("name", "change", { shouldBlur: true });

      expect(form.meta.get().isBlurred).toBe(true);
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

      expect(validator).toHaveBeenCalledWith("John", form);
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

      expect(validator).toHaveBeenCalledWith("john@example.com", form);
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

      expect(asyncValidator).toHaveBeenCalledWith("Jane", form);
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
      expect(asyncValidator).toHaveBeenCalledWith("John", form);
    });
  });
});
