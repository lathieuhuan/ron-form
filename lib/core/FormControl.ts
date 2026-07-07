import type {
  AnyObject,
  DeepKeys,
  DeepValue,
  FieldError,
  FieldErrors,
  FieldMeta,
  FieldState,
  SetFieldValueOptions,
  Updater,
  ValidateSyncOptions,
  ValidationCause,
  ValidationResult,
} from "./types";

import { DEFAULT_FORM_META } from "./constants";
import { FormCore, FormCoreOptions } from "./FormCore";
import { RunningValidatorMap } from "./RunningValidatorMap";
import { clone } from "./utils/clone";
import { collectFieldPaths, isPlainObject, set } from "./utils/object";
import { parseRawError } from "./utils/parseRawError";
import { transformErrors } from "./utils/transformErrors";

export interface FormControlOptions<TFormValues> extends FormCoreOptions<TFormValues> {
  onSubmit?: (props: { values: TFormValues }) => void;
  onSubmitFailed?: () => void;
}

export class FormControl<TFormValues> extends FormCore<TFormValues> {
  onSubmit?: (props: { values: TFormValues }) => void;
  onSubmitFailed?: () => void;

  constructor(options: FormControlOptions<TFormValues> = {}) {
    super(options);

    this.onSubmit = options.onSubmit;
    this.onSubmitFailed = options.onSubmitFailed;
  }

  _runSyncValidator = <TField extends DeepKeys<TFormValues>>(
    cause: ValidationCause,
    field: TField,
    value: DeepValue<TFormValues, TField> = this.getFieldValue(field),
  ): FieldError<TField>[] => {
    const validator = this.validators[cause][field];
    if (validator == null) return [];

    return transformErrors(field, cause, validator({ value, form: this }));
  };

  _runAsyncValidator = async <TField extends DeepKeys<TFormValues>>(
    cause: ValidationCause,
    field: TField,
    value: DeepValue<TFormValues, TField> = this.getFieldValue(field),
  ): Promise<FieldError<TField>[]> => {
    const validator = this.asyncValidators[cause][field];
    if (validator == null) return [];

    let result: ValidationResult;

    try {
      result = await validator({ value, form: this });
    } catch (e) {
      result = parseRawError(e);
    }

    return transformErrors(field, `${cause}Async`, result);
  };

  _validateSync = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    options: ValidateSyncOptions,
  ) => {
    const fieldMeta = {
      ...this.getFieldMeta(field),
    };

    if (options.shouldBlur && !fieldMeta.isBlurred) {
      fieldMeta.isBlurred = true;
    }
    if (options.shouldTouch && !fieldMeta.isTouched) {
      fieldMeta.isTouched = true;
    }
    if (options.shouldDirty && !fieldMeta.isDirty) {
      fieldMeta.isDirty = true;
    }

    const value = this.getFieldValue(field);
    const errors = this._runSyncValidator(cause, field, value);
    const errorMap = {
      ...this.getFieldErrorMap(field),
      [cause]: errors,
    };

    this.updateAndNotifyField(field, {
      value,
      meta: fieldMeta,
      errorMap,
    });

    return errors;
  };

  /**
   * @public
   * @options Default: { shouldBlur: false, shouldTouch: true, shouldDirty: false }
   */
  validateSync = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    options: Partial<ValidateSyncOptions> = {},
  ) => {
    const { shouldBlur = false, shouldTouch = true, shouldDirty = false } = options;
    const errors = this._validateSync(field, cause, {
      shouldBlur,
      shouldTouch,
      shouldDirty,
    });

    this.syncMeta();

    return errors;
  };

  _validateAsync = async <TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    abortCtrl: AbortController,
  ): Promise<FieldError<TField>[]> => {
    if (this.asyncValidators[cause][field] == null) {
      return [];
    }

    this.runningValidatorMap.add(field, cause);

    // Update field meta
    let newMeta = this.getFieldMeta(field);

    if (!newMeta.isValidating) {
      newMeta = {
        ...newMeta,
        isValidating: true,
      };

      this.updateAndNotifyField(field, { meta: newMeta });
    }

    const errors = await this._runAsyncValidator(cause, field);

    if (abortCtrl.signal.aborted) {
      return [];
    }

    this.runningValidatorMap.remove(field, cause);

    // Update field state
    newMeta = {
      ...this.getFieldMeta(field),
      isValidating: this.runningValidatorMap.isAnyRunning(field),
    };

    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      [`${cause}Async`]: errors,
    };

    this.updateAndNotifyField(field, {
      meta: newMeta,
      errorMap: newErrorMap,
    });

    return errors;
  };

  /**
   * @public
   */
  validateAsync = async <TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
  ): Promise<FieldError<TField>[]> => {
    const timeoutId = this.timeoutIdMaps[cause].get(field);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      this.timeoutIdMaps[cause].delete(field);
    }

    const abortCtrl = new AbortController();

    this.abortCtrlMaps[cause].get(field)?.abort();
    this.abortCtrlMaps[cause].set(field, abortCtrl);

    this.meta.set({ isValidating: true });

    const errors = await this._validateAsync(field, cause, abortCtrl);

    this.meta.set({
      isValidating: this.runningValidatorMap.isAnyRunning(field),
    });

    return errors;
  };

  /**
   * @public
   */
  setFieldValue = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    value: DeepValue<TFormValues, TField>,
    options: SetFieldValueOptions = {},
  ): boolean => {
    const clonedValue = isPlainObject(value) ? clone(value) : value;
    const success = set(this._values as AnyObject, field, clonedValue);

    if (!success) {
      console.error(`Field ${field} not found in values`);
      return false;
    }

    const { dontTouch = false, dontDirty = false, dontValidate = false } = options;
    const subFields = collectFieldPaths(value, field, [field]) || [field];

    if (dontValidate) {
      for (const subField of subFields) {
        const meta = this.getFieldMeta(subField);
        const newMeta: FieldMeta = {
          isBlurred: meta.isBlurred,
          isTouched: dontTouch ? meta.isTouched : true,
          isDirty: dontDirty ? meta.isDirty : true,
          isValidating: false,
        };

        this.updateAndNotifyField(subField, {
          value: clonedValue,
          meta: newMeta,
        });
      }

      this.syncMeta();

      return true;
    }

    // ===== VALIDATE =====

    const asyncValidators = this.asyncValidators.change;
    const asyncValidateFields = new Set<DeepKeys<TFormValues>>();

    for (const subField of subFields) {
      const errors = this._validateSync(subField, "change", {
        shouldBlur: false,
        shouldTouch: !dontTouch,
        shouldDirty: !dontDirty,
      });

      // TODO add an option to validate async even if there are sync errors
      if (errors.length === 0 && asyncValidators[subField] != null) {
        asyncValidateFields.add(subField);
      }
    }

    this.syncMeta();

    // ===== ASYNC VALIDATION =====

    for (const field of asyncValidateFields) {
      let timeoutId = this.timeoutIdMaps.change.get(field);

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }

      const abortCtrl = new AbortController();

      this.abortCtrlMaps.change.get(field)?.abort();
      this.abortCtrlMaps.change.set(field, abortCtrl);

      timeoutId = setTimeout(async () => {
        if (abortCtrl.signal.aborted) {
          return;
        }

        this.meta.set({ isValidating: true });

        await this._validateAsync(field, "change", abortCtrl);

        this.meta.set({
          isValidating: this.runningValidatorMap.isAnyRunning(),
        });
      }, this.asyncDebounceMs);

      this.timeoutIdMaps.change.set(field, timeoutId);
    }

    return true;
  };

  /**
   * @public
   */
  setFieldMeta = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    updater: Updater<FieldMeta>,
  ) => {
    const newMeta = typeof updater === "function" ? updater(this.getFieldMeta(field)) : updater;

    this.updateAndNotifyField(field, {
      meta: newMeta,
    });

    this.syncMeta();
  };

  /**
   * @public
   */
  handleSubmit = () => {
    this.meta.set(({ submitCount }) => ({
      isTouched: true,
      submitCount: submitCount + 1,
    }));

    let isValid = true;

    const updateMap = new Map<
      DeepKeys<TFormValues>,
      FieldState<TFormValues, DeepKeys<TFormValues>>
    >();

    for (const field of Object.keys(this.validators.change) as DeepKeys<TFormValues>[]) {
      const update = updateMap.get(field) || this.getFieldState(field);

      if (!update.meta.isTouched) {
        update.meta = {
          ...update.meta,
          isTouched: true,
        };
      }

      const errors = this._runSyncValidator("change", field);

      if (errors.length > 0) {
        isValid = false;

        update.errorMap = {
          ...update.errorMap,
          change: errors,
        };
      }

      updateMap.set(field, update);
    }

    for (const field of Object.keys(this.validators.blur) as DeepKeys<TFormValues>[]) {
      const update = updateMap.get(field) || this.getFieldState(field);

      if (!update.meta.isTouched) {
        update.meta = {
          ...update.meta,
          isTouched: true,
        };
      }

      const errors = this._runSyncValidator("blur", field);

      if (errors.length > 0) {
        isValid = false;

        update.errorMap = {
          ...update.errorMap,
          blur: errors,
        };
      }

      updateMap.set(field, update);
    }

    for (const [field, update] of updateMap.entries()) {
      this.updateAndNotifyField(field, update);
    }

    this.syncMeta();

    if (isValid) {
      this.onSubmit?.({ values: clone(this._values) });
    } else {
      this.onSubmitFailed?.();
    }
  };

  /**
   * @public
   */
  reset = () => {
    this._values = clone(this._defaultValues);

    for (const cause of <ValidationCause[]>["change", "blur"]) {
      for (const timeoutId of this.timeoutIdMaps[cause].values()) {
        clearTimeout(timeoutId);
      }
      for (const abortCtrl of this.abortCtrlMaps[cause].values()) {
        abortCtrl.abort();
      }
    }

    this.runningValidatorMap = new RunningValidatorMap<TFormValues>();

    this.fieldMetaMap.clear();
    this.fieldErrorMap.clear();

    for (const [field, subject] of this.fieldSubjects.entries()) {
      subject.next({
        value: this.getFieldValue(field),
        meta: this.getFieldMeta(field),
        errorMap: this.getFieldErrorMap(field),
      });
    }

    this.meta.set(DEFAULT_FORM_META);
  };
}
