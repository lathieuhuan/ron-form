import type { SetFieldValueOptions, ValidateSyncOptions } from "./FormApi.type";
import type {
  AnyObject,
  DeepKeys,
  DeepValue,
  FieldError,
  FieldErrors,
  FieldMeta,
  FieldState,
  Updater,
  ValidationCause,
} from "./types";

import { DEFAULT_ERROR_MAP, DEFAULT_FORM_META } from "./constants";
import { FormCore, FormCoreOptions } from "./FormCore";
import { RunningValidatorMap } from "./RunningValidatorMap";
import { clone } from "./utils/clone";
import { set } from "./utils/set";

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

  /**
   * @public
   */
  validateSync = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    options: ValidateSyncOptions = {},
  ) => {
    let fieldMeta = this.getFieldMeta(field);

    if (options.shouldTouch && !fieldMeta.isTouched) {
      fieldMeta = {
        ...fieldMeta,
        isTouched: true,
      };
    }

    if (options.shouldBlur && !fieldMeta.isBlurred) {
      fieldMeta = {
        ...fieldMeta,
        isBlurred: true,
      };
    }

    const errors = this._runSyncValidators(cause, field);
    let errorMap = this.getFieldErrorMap(field);

    if (errors.length || errorMap[cause]?.length) {
      errorMap = {
        ...errorMap,
        [cause]: errors,
      };
    }

    this.updateAndNotifyField(field, {
      meta: fieldMeta,
      errorMap,
    });

    this.meta.set({
      isBlurred: fieldMeta.isBlurred,
      isTouched: fieldMeta.isTouched,
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
    const success = set(this._values as AnyObject, field, value);

    if (!success) {
      console.error(`Field ${field} not found in values`);
      return false;
    }

    const { dontTouch = false, dontDirty = false, dontValidate = false } = options;

    const meta = this.getFieldMeta(field);
    const newMeta: FieldMeta = {
      isBlurred: meta.isBlurred,
      isTouched: dontTouch ? meta.isTouched : true,
      isDirty: dontDirty ? meta.isDirty : true,
      isValidating: false,
    };

    if (dontValidate) {
      // Clear all change errors because they are for the old value.
      // TODO check if we should clear other errors as well.
      const newErrorMap: FieldErrors<TField> = {
        ...this.getFieldErrorMap(field),
        change: [],
        changeAsync: [],
      };

      this.updateAndNotifyField(field, {
        value,
        meta: newMeta,
        errorMap: newErrorMap,
      });

      this.syncMeta();

      return true;
    }

    // ===== VALIDATE =====

    // Reset all errors even errors by other causes
    // because those errors are for the old value.
    // This behaviour is different from tanstack form v1.33.0
    // who kept blur errors on value change and not blur yet.
    let newErrorMap = { ...DEFAULT_ERROR_MAP } as FieldErrors<TField>;

    const errors = this._runSyncValidators("change", field, value);

    if (errors.length) {
      newErrorMap = {
        ...newErrorMap,
        change: errors,
      };
    }

    this.updateAndNotifyField(field, {
      value,
      meta: newMeta,
      errorMap: newErrorMap,
    });

    this.syncMeta();

    // ===== ASYNC VALIDATION =====

    let timeoutId = this.timeoutIdMaps.change.get(field);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    this.abortCtrlMaps.change.get(field)?.abort();

    // TODO add an option to validate async even if there are sync errors
    if (errors.length === 0 && this.asyncValidators.change[field] != null) {
      const abortCtrl = new AbortController();

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

      const errors = this._runSyncValidators("change", field);

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

      const errors = this._runSyncValidators("blur", field);

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
