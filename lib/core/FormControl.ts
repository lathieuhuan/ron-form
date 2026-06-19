import type {
  AnyObject,
  AsyncValidatorMap,
  DeepKeys,
  DeepValue,
  ErrorCauseType,
  FieldError,
  FieldErrors,
  FieldMeta,
  FieldState,
  FormAsyncValidators,
  FormValidators,
  Updater,
  ValidationCause,
  ValidatorMap,
} from "./types";

import { DEFAULT_ERROR_MAP, DEFAULT_FORM_META, DEFAULT_META } from "./constants";
import { FormMetaControl, type FormMetaApi } from "./FormMetaControl";
import { RunningValidatorMap } from "./RunningValidatorMap";
import { clone } from "./utils/clone";
import { createSubject, Subject } from "./utils/createSubject";
import { get } from "./utils/get";
import { set } from "./utils/set";
import { transformErrors } from "./utils/transformErrors";

type FieldSubjects<TFormValues, TKey extends DeepKeys<TFormValues>> = Map<
  TKey,
  Subject<FieldState<TFormValues, TKey>>
>;

type TimeoutIDMapByCause<TFormValues> = {
  [key in ValidationCause]: Map<DeepKeys<TFormValues>, NodeJS.Timeout>;
};

type AbortControllerMapByCause<TFormValues> = {
  [key in ValidationCause]: Map<DeepKeys<TFormValues>, AbortController>;
};

export interface FormControlOptions<TFormValues> {
  defaultValues?: TFormValues;
  changeValidators?: FormValidators<TFormValues>;
  changeAsyncValidators?: FormAsyncValidators<TFormValues>;
  blurValidators?: FormValidators<TFormValues>;
  blurAsyncValidators?: FormAsyncValidators<TFormValues>;
  asyncDebounceMs?: number;
  onSubmit?: (props: { values: TFormValues }) => void;
  onSubmitFailed?: () => void;
}

export class FormControl<TFormValues> {
  _defaultValues: TFormValues;
  _values: TFormValues;
  meta: FormMetaApi;

  fieldMetaMap: Map<DeepKeys<TFormValues>, FieldMeta> = new Map();
  fieldErrorMap: Map<DeepKeys<TFormValues>, FieldErrors<DeepKeys<TFormValues>>> = new Map();

  asyncDebounceMs: number;

  validators: ValidatorMap<TFormValues>;
  asyncValidators: AsyncValidatorMap<TFormValues>;

  timeoutIdMaps: TimeoutIDMapByCause<TFormValues> = {
    change: new Map(),
    blur: new Map(),
  };
  abortCtrlMaps: AbortControllerMapByCause<TFormValues> = {
    change: new Map(),
    blur: new Map(),
  };
  runningValidatorMap = new RunningValidatorMap<TFormValues>();

  fieldSubjects: FieldSubjects<TFormValues, DeepKeys<TFormValues>> = new Map();

  onSubmit?: (props: { values: TFormValues }) => void;
  onSubmitFailed?: () => void;

  constructor({
    defaultValues,
    changeValidators,
    changeAsyncValidators,
    blurValidators,
    blurAsyncValidators,
    asyncDebounceMs = 300,
    onSubmit,
    onSubmitFailed,
  }: FormControlOptions<TFormValues> = {}) {
    this._defaultValues = defaultValues !== undefined ? clone(defaultValues) : ({} as TFormValues);
    this._values = clone(this._defaultValues);

    this.validators = {
      change: changeValidators !== undefined ? changeValidators : {},
      blur: blurValidators !== undefined ? blurValidators : {},
    };
    this.asyncValidators = {
      change: changeAsyncValidators !== undefined ? changeAsyncValidators : {},
      blur: blurAsyncValidators !== undefined ? blurAsyncValidators : {},
    };

    this.asyncDebounceMs = asyncDebounceMs;
    this.meta = new FormMetaControl();

    this.onSubmit = onSubmit;
    this.onSubmitFailed = onSubmitFailed;
  }

  get values() {
    return this._values;
  }

  /**
   * @public
   */
  getFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
  ): DeepValue<TFormValues, TField> {
    return get(this._values as AnyObject, field);
  }

  /**
   * @public
   */
  getFieldMeta<TField extends DeepKeys<TFormValues>>(field: TField): FieldMeta {
    return this.fieldMetaMap.get(field) || { ...DEFAULT_META };
  }

  /**
   * @public
   */
  getFieldErrorMap<TField extends DeepKeys<TFormValues>>(field: TField) {
    return (this.fieldErrorMap.get(field) || { ...DEFAULT_ERROR_MAP }) as FieldErrors<TField>;
  }

  /**
   * @public
   */
  getFieldState<TField extends DeepKeys<TFormValues>>(
    field: TField,
  ): FieldState<TFormValues, TField> {
    return {
      value: this.getFieldValue(field),
      meta: this.getFieldMeta(field),
      errorMap: this.getFieldErrorMap(field),
    };
  }

  /**
   * @public
   */
  subscribeField<TField extends DeepKeys<TFormValues>>(
    key: TField,
    subscriber: (field: FieldState<TFormValues, TField>) => void,
  ) {
    let subject = this.fieldSubjects.get(key);

    if (subject === undefined) {
      subject = createSubject();

      this.fieldSubjects.set(key, subject);
    }

    return (subject as Subject<FieldState<TFormValues, TField>>).subscribe(subscriber);
  }

  syncMeta() {
    let isBlurred = false;
    let isTouched = false;
    let isDirty = false;
    let isValidating = false;

    for (const meta of this.fieldMetaMap.values()) {
      isBlurred = isBlurred || meta.isBlurred;
      isValidating = isValidating || meta.isValidating;
      isTouched = isTouched || meta.isTouched;
      isDirty = isDirty || meta.isDirty;

      if (isBlurred && isTouched && isDirty && isValidating) {
        break;
      }
    }

    this.meta.set({
      isBlurred,
      isTouched,
      isDirty,
      isValidating,
    });
  }

  /**
   * If `value` is not passed AND
   * (`meta` & `errorMap` are not passed/undefined OR
   * `meta` & `errorMap` are the same as the current ones),
   * this method will short circuit.
   */
  updateAndNotifyField<TField extends DeepKeys<TFormValues>>(
    field: TField,
    changes: Partial<FieldState<TFormValues, TField>>,
  ) {
    let { value, meta, errorMap } = changes;
    const valueChanged = "value" in changes;

    const currentMeta = this.getFieldMeta(field);
    const currentErrorMap = this.getFieldErrorMap(field);

    // Note: The meta & errorMap passed in changes can already be the current ones.
    meta = meta === undefined ? currentMeta : meta;
    errorMap = errorMap === undefined ? currentErrorMap : errorMap;

    if (!valueChanged && meta === currentMeta && errorMap === currentErrorMap) {
      return;
    }

    // TODO write test for value === undefined/null (e.g. clear value)
    if (!valueChanged) {
      value = this.getFieldValue(field);
    }

    this.fieldMetaMap.set(field, meta);
    this.fieldErrorMap.set(field, errorMap);

    this.fieldSubjects.get(field)?.next({
      value: value as DeepValue<TFormValues, TField>,
      meta,
      errorMap,
    });
  }

  /**
   * @public
   */
  setFieldMeta<TField extends DeepKeys<TFormValues>>(field: TField, updater: Updater<FieldMeta>) {
    const newMeta = typeof updater === "function" ? updater(this.getFieldMeta(field)) : updater;

    this.updateAndNotifyField(field, {
      meta: newMeta,
    });

    this.syncMeta();
  }

  _runSyncValidators<TField extends DeepKeys<TFormValues>>(
    cause: ValidationCause,
    field: TField,
    value: DeepValue<TFormValues, TField> = this.getFieldValue(field),
  ) {
    const validator = this.validators[cause][field];
    if (validator == null) return [];

    const errors = transformErrors(field, cause, validator({ value }));

    return errors;
  }

  /**
   * @public
   */
  validateSync<TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    options: {
      shouldBlur?: boolean;
      shouldTouch?: boolean;
    } = {},
  ) {
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

    const value = this.getFieldValue(field);
    const errors = this._runSyncValidators(cause, field, value);
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
  }

  async validateAsync<TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    abortCtrl: AbortController,
  ): Promise<FieldError<TField>[]> {
    const validator = this.asyncValidators[cause][field];

    if (validator == null || abortCtrl.signal.aborted) {
      return [];
    }

    const value = this.getFieldValue(field);
    const errorCause: ErrorCauseType = `${cause}Async`;
    let errors: FieldError<TField>[] | undefined;

    try {
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

      // Update form meta
      this.meta.set({ isValidating: true });

      // Validate
      const rawErrors = await validator({ value });

      if (abortCtrl.signal.aborted) {
        return [];
      }

      errors = transformErrors(field, errorCause, rawErrors);
    } catch (e) {
      // TODO handle error
      console.error(e);
    }

    this.runningValidatorMap.remove(field, cause);

    // Update field state
    const newMeta: FieldMeta = {
      ...this.getFieldMeta(field),
      isValidating: this.runningValidatorMap.isAnyRunning(field),
    };
    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      [errorCause]: errors,
    };

    this.updateAndNotifyField(field, {
      meta: newMeta,
      errorMap: newErrorMap,
    });

    // Update form meta
    this.meta.set({
      isValidating: this.runningValidatorMap.isAnyRunning(),
    });

    return errors || [];
  }

  /**
   * @public
   */
  setFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
    value: DeepValue<TFormValues, TField>,
    options: {
      dontTouch?: boolean;
      dontDirty?: boolean;
      dontValidate?: boolean;
    } = {},
  ): boolean {
    const success = set(this._values as AnyObject, field, value);

    if (!success) {
      console.error(`Field ${field} not found in values`);
      return false;
    }

    // ===== CLEANUP =====

    this.abortCtrlMaps.change.get(field)?.abort();

    let timeoutId = this.timeoutIdMaps.change.get(field);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // ===== MAIN LOGIC =====

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

    // TODO add an option to validate async even if there are sync errors
    if (errors.length === 0 && this.asyncValidators.change[field] != null) {
      const abortCtrl = new AbortController();

      this.abortCtrlMaps.change.set(field, abortCtrl);

      timeoutId = setTimeout(() => {
        this.validateAsync(field, "change", abortCtrl);
      }, this.asyncDebounceMs);

      this.timeoutIdMaps.change.set(field, timeoutId);
    }

    return true;
  }

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

      const errors = this._runSyncValidators("change", field, this.getFieldValue(field));

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

      const errors = this._runSyncValidators("blur", field, this.getFieldValue(field));

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
  reset() {
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
  }
}

export type FormApi<TFormValues> = Pick<
  FormControl<TFormValues>,
  | "values"
  | "meta"
  | "getFieldValue"
  | "getFieldMeta"
  | "getFieldErrorMap"
  | "getFieldState"
  | "subscribeField"
  | "setFieldValue"
  | "setFieldMeta"
  | "validateSync"
  | "reset"
> & {
  handleSubmit(): void;
};
