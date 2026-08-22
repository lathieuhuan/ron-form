import type {
  AnyObject,
  DeepKeys,
  DeepValue,
  FieldError,
  FieldErrors,
  FieldMeta,
  FieldState,
  Noop,
  SetFieldValueOptions,
  Updater,
  ValidateSyncOptions,
  ValidationCause,
  ValidationResult,
  ValueChangeData,
} from "./types";

import { DEFAULT_CHANGE_CAUSE, DEFAULT_FORM_META, ERROR_CAUSES } from "./constants";
import { FormCore, FormCoreOptions } from "./FormCore";
import { RunningValidatorMap } from "./RunningValidatorMap";
import { cache } from "./utils/cache";
import { clone } from "./utils/clone";
import { createSubject, Observer, Subject } from "./utils/createSubject";
import { collectFieldPaths, entries, get, isPlainObject, keys, set } from "./utils/object";
import { parseRawError } from "./utils/parseRawError";
import { transformErrors } from "./utils/transformErrors";
import { parseWildcardDeepKeys } from "./utils/parseWildcardDeepKeys";

type ValueSubjects<TFormValues, TKey extends DeepKeys<TFormValues>> = Map<
  TKey,
  Subject<ValueChangeData<TFormValues, TKey>>
>;

type ValueSubscribers<TFormValues> = {
  [key in DeepKeys<TFormValues>]?: (props: ValueChangeData<TFormValues, key>) => void;
};

interface OnSubmitData<TFormValues> {
  values: TFormValues;
  form: FormControl<TFormValues>;
}

type AllFieldErrors<TFormValues> = Partial<
  Record<DeepKeys<TFormValues>, FieldErrors<DeepKeys<TFormValues>>>
>;

interface OnSubmitFailedData<TFormValues> {
  errors: AllFieldErrors<TFormValues>;
  form: FormControl<TFormValues>;
}

export interface FormControlOptions<TFormValues> extends FormCoreOptions<TFormValues> {
  valueSubscribers?: ValueSubscribers<TFormValues>;
  onSubmit?: (data: OnSubmitData<TFormValues>) => void;
  onSubmitFailed?: (data: OnSubmitFailedData<TFormValues>) => void;
}

export class FormControl<TFormValues> extends FormCore<TFormValues> {
  onSubmit?: FormControlOptions<TFormValues>["onSubmit"];
  onSubmitFailed?: FormControlOptions<TFormValues>["onSubmitFailed"];

  valueSubjects: ValueSubjects<TFormValues, DeepKeys<TFormValues>> = new Map();
  unsubscribers: Noop[] = [];

  constructor(options: FormControlOptions<TFormValues> = {}) {
    super(options);

    this.onSubmit = options.onSubmit;
    this.onSubmitFailed = options.onSubmitFailed;

    const { valueSubscribers } = options;

    if (valueSubscribers) {
      for (const [field, subscriber] of entries(valueSubscribers)) {
        if (!subscriber) continue;

        const unsubscribe = this.subscribeFieldValue(field, subscriber);

        this.unsubscribers.push(unsubscribe);
      }
    }
  }

  /**
   * @public
   */
  subscribeFieldValue = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    subscriber: Observer<ValueChangeData<TFormValues, TField>>,
  ) => {
    const subject = this.valueSubjects.get(field) || createSubject();

    this.valueSubjects.set(field, subject);

    return (subject as Subject<ValueChangeData<TFormValues, TField>>).subscribe(subscriber);
  };

  _runSyncValidator = <TField extends DeepKeys<TFormValues>>(
    cause: ValidationCause,
    field: TField,
    value: DeepValue<TFormValues, TField> = this.getFieldValue(field),
  ): FieldError<TField>[] => {
    const validatorKey = field
      .split(".")
      .map((segment) => (/^\d+$/.test(segment) ? "[n]" : segment))
      .join(".") as DeepKeys<TFormValues>;
    const validator = this.validators[cause][validatorKey];

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
    options: ValidateSyncOptions = {},
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

  scheduleAsyncValidation = (field: DeepKeys<TFormValues>, cause: ValidationCause) => {
    let timeoutId = this.timeoutIdMaps[cause].get(field);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    const abortCtrl = new AbortController();

    this.abortCtrlMaps[cause].get(field)?.abort();
    this.abortCtrlMaps[cause].set(field, abortCtrl);

    timeoutId = setTimeout(async () => {
      if (abortCtrl.signal.aborted) {
        return;
      }

      this.meta.set({ isValidating: true });

      await this._validateAsync(field, cause, abortCtrl);

      this.meta.set({
        isValidating: this.runningValidatorMap.isAnyRunning(),
      });
    }, this.asyncDebounceMs);

    this.timeoutIdMaps[cause].set(field, timeoutId);

    return {
      timeoutId,
      abortCtrl,
    };
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
    const oldValues = clone(this._values);

    const success = set(this._values as AnyObject, field, clonedValue);

    if (!success) {
      console.error(`Field ${field} not found in values`);
      return false;
    }

    const {
      dontTouch = false,
      dontDirty = false,
      dontValidate = false,
      cause = DEFAULT_CHANGE_CAUSE,
    } = options;
    const subFields = collectFieldPaths(value, field, [field]);

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
        this.valueSubjects.get(subField)?.next({
          value: this.getFieldValue(subField),
          oldValue: get(oldValues as AnyObject, subField),
          form: this,
          cause,
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

      this.valueSubjects.get(subField)?.next({
        value: this.getFieldValue(subField),
        oldValue: get(oldValues as AnyObject, subField),
        form: this,
        cause,
      });

      // TODO add an option to validate async even if there are sync errors
      if (errors.length === 0 && asyncValidators[subField] != null) {
        asyncValidateFields.add(subField);
      }
    }

    this.syncMeta();

    // ===== ASYNC VALIDATION =====

    for (const field of asyncValidateFields) {
      this.scheduleAsyncValidation(field, "change");
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

  isFieldError = <TField extends DeepKeys<TFormValues>>(field: TField) => {
    const errorMap = this.getFieldErrorMap(field);
    return ERROR_CAUSES.some((cause) => {
      const errors = errorMap[cause] || [];
      return errors.length > 0;
    });
  };

  /**
   * @public
   */
  handleSubmit = () => {
    // TODO this also notify
    this.meta.set(({ submitCount }) => ({
      isTouched: true,
      submitCount: submitCount + 1,
    }));

    let isValid = true;

    const updateMap = new Map<
      DeepKeys<TFormValues>,
      FieldState<TFormValues, DeepKeys<TFormValues>>
    >();

    const updateField = (field: DeepKeys<TFormValues>, cause: ValidationCause) => {
      const update = updateMap.get(field) || this.getFieldState(field);

      if (!update.meta.isTouched) {
        update.meta = {
          ...update.meta,
          isTouched: true,
        };
      }

      const errors = this._runSyncValidator(cause, field);

      if (errors.length > 0) {
        isValid = false;

        update.errorMap = {
          ...update.errorMap,
          [cause]: errors,
        };
      }

      updateMap.set(field, update);
    };

    for (const field of keys(this.validators.change)) {
      for (const subField of parseWildcardDeepKeys<TFormValues>(field, this._values as AnyObject)) {
        updateField(subField, "change");
      }
    }

    for (const field of keys(this.validators.blur)) {
      for (const subField of parseWildcardDeepKeys<TFormValues>(field, this._values as AnyObject)) {
        updateField(subField, "blur");
      }
    }

    for (const [field, update] of updateMap.entries()) {
      this.updateAndNotifyField(field, update);
    }

    this.syncMeta();

    if (isValid) {
      this.onSubmit?.({
        values: clone(this._values),
        form: this,
      });
    } else if (this.onSubmitFailed) {
      const errors: AllFieldErrors<TFormValues> = {};

      for (const [field, errorMap] of this.fieldErrorMap.entries()) {
        if (this.isFieldError(field)) {
          errors[field] = errorMap;
        }
      }

      this.onSubmitFailed({
        errors,
        form: this,
      });
    }
  };

  /**
   * @public
   */
  reset = () => {
    const oldValues = clone(this._values);

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

    const values = cache((field: DeepKeys<TFormValues>) => this.getFieldValue(field));

    for (const [field, subject] of this.fieldSubjects.entries()) {
      subject.next({
        value: values.get(field),
        meta: this.getFieldMeta(field),
        errorMap: this.getFieldErrorMap(field),
      });
    }

    for (const [field, subject] of this.valueSubjects.entries()) {
      subject.next({
        value: values.get(field),
        oldValue: get(oldValues as AnyObject, field),
        form: this,
        cause: DEFAULT_CHANGE_CAUSE,
      });
    }

    this.meta.set(DEFAULT_FORM_META);
  };
}
