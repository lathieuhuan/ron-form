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

import { DEFAULT_CHANGE_CAUSE, DEFAULT_FORM_META, DEFAULT_META, ERROR_CAUSES } from "./constants";
import { AsyncValidationSpec, FormCore, FormCoreOptions, ValidationSpec } from "./FormCore";
import { RunningValidatorMap } from "./RunningValidatorMap";
import { cache } from "./utils/cache";
import { clone } from "./utils/clone";
import { collectFieldPaths } from "./utils/collectFieldPaths";
import { createSubject, Observer, Subject } from "./utils/createSubject";
import { entries, get, isPlainObject, keys, set, update } from "./utils/object";
import { parseRawError } from "./utils/parseRawError";
import { parseWildcardDeepKeys } from "./utils/parseWildcardDeepKeys";
import { Patcher } from "./utils/Patcher";
import { transformErrors } from "./utils/transformErrors";

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
    spec: ValidationSpec<TFormValues, TField>,
  ): FieldError<TField>[] => {
    if (spec.validator == null) return [];

    return transformErrors(spec.field, spec.cause, spec.validator(spec.value, this));
  };

  _runAsyncValidator = async <TField extends DeepKeys<TFormValues>>(
    spec: AsyncValidationSpec<TFormValues, TField>,
  ): Promise<FieldError<TField>[]> => {
    if (spec.validator == null) return [];

    let result: ValidationResult;

    try {
      result = await spec.validator(spec.value, this);
    } catch (e) {
      result = parseRawError(e);
    }

    return transformErrors(spec.field, `${spec.cause}Async`, result);
  };

  _validateSync = <TField extends DeepKeys<TFormValues>>(
    spec: ValidationSpec<TFormValues, TField>,
    options: ValidateSyncOptions,
  ) => {
    const { cause, field } = spec;
    const metaPatcher = new Patcher(this.getFieldMeta(field));

    if (options.shouldBlur) {
      metaPatcher.set("isBlurred", true);
    }
    if (options.shouldTouch) {
      metaPatcher.set("isTouched", true);
    }
    if (options.shouldDirty) {
      metaPatcher.set("isDirty", true);
    }

    const errors = this._runSyncValidator(spec);
    const currentErrors = metaPatcher.value.errors;

    if (errors.length || currentErrors[cause].length) {
      metaPatcher.set("errors", {
        ...currentErrors,
        [cause]: errors,
      });
    }

    return metaPatcher.value;
  };

  /**
   * @public
   * @options Default: { shouldBlur: false, shouldTouch: true, shouldDirty: false }
   */
  validateSync = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    options: Partial<ValidateSyncOptions> = {},
  ): FieldError<TField>[] => {
    const { shouldBlur = false, shouldTouch = true, shouldDirty = false } = options;
    const validationSpec = this.validationSpec(cause, field);
    const meta = this._validateSync(validationSpec, {
      shouldBlur,
      shouldTouch,
      shouldDirty,
    });

    const updated = this.updateAndNotifyField(field, {
      meta,
    });

    if (updated) {
      this.syncMeta();
    }

    return meta.errors[cause] as FieldError<TField>[];
  };

  _validateAsync = async <TField extends DeepKeys<TFormValues>>(
    spec: AsyncValidationSpec<TFormValues, TField>,
    abortCtrl: AbortController,
  ): Promise<FieldError<TField>[]> => {
    if (spec.validator == null || spec.fieldId == null) {
      return [];
    }

    const { fieldId, cause } = spec;
    const initialField = this.fieldKeyFrom(fieldId);

    if (initialField == null) {
      return [];
    }

    const runId = this.runningValidatorMap.add(fieldId, cause);
    let runRemoved = false;

    // TOCHECK this logic
    const removeRun = (notify: boolean) => {
      if (runRemoved) {
        return;
      }

      this.runningValidatorMap.remove(fieldId, cause, runId);
      runRemoved = true;

      if (!notify) {
        return;
      }

      const currentField = this.fieldKeyFrom(fieldId);

      if (currentField == null) {
        return;
      }

      const metaPatcher = new Patcher(this.getFieldMeta(currentField));

      metaPatcher.set("isValidating", this.runningValidatorMap.isAnyRunning(fieldId));

      this.updateAndNotifyField(currentField, {
        meta: metaPatcher.value,
      });
      this.syncMeta();
    };

    const handleAbort = () => removeRun(true);

    abortCtrl.signal.addEventListener("abort", handleAbort, { once: true });

    {
      // Turn on isValidating
      const { success, result } = update(this.getFieldMeta(initialField), "isValidating", true);

      if (success) {
        this.updateAndNotifyField(initialField, { meta: result });
      }
    }

    // TOCHECK why we need try/finally?
    try {
      const resolvedErrors = await this._runAsyncValidator(spec);
      const currentField = this.fieldKeyFrom(fieldId);

      if (abortCtrl.signal.aborted || currentField == null) {
        return [];
      }

      const errors = resolvedErrors.map((error) => ({
        ...error,
        path: currentField,
      })) as FieldError<TField>[];

      removeRun(false);

      const meta = this.getFieldMeta(currentField);

      const newErrors: FieldErrors<DeepKeys<TFormValues>> = {
        ...meta.errors,
        [`${cause}Async`]: errors,
      };

      this.updateAndNotifyField(currentField, {
        meta: {
          ...meta,
          isValidating: this.runningValidatorMap.isAnyRunning(fieldId),
          errors: newErrors,
        },
      });

      return errors;
    } finally {
      abortCtrl.signal.removeEventListener("abort", handleAbort);
      removeRun(true);
    }
  };

  /**
   * @public
   */
  validateAsync = async <TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
  ): Promise<FieldError<TField>[]> => {
    const validationSpec = this.asyncValidationSpec(cause, field);
    const { fieldId } = validationSpec;

    if (fieldId == null) {
      return [];
    }

    const timeoutIds = this.timeoutIdMaps[cause];

    clearTimeout(timeoutIds.get(fieldId));
    timeoutIds.delete(fieldId);

    const abortCtrls = this.abortCtrlMaps[cause];
    const abortCtrl = new AbortController();

    abortCtrls.get(fieldId)?.abort();
    abortCtrls.set(fieldId, abortCtrl);

    this.meta.set({ isValidating: true });

    const errors = await this._validateAsync(validationSpec, abortCtrl);

    if (abortCtrls.get(fieldId) === abortCtrl) {
      abortCtrls.delete(fieldId);
    }

    this.meta.set({
      isValidating: this.runningValidatorMap.isAnyRunning(),
    });

    return errors;
  };

  scheduleAsyncValidation = <TField extends DeepKeys<TFormValues>>(
    spec: AsyncValidationSpec<TFormValues, TField>,
  ) => {
    if (spec.validator == null || spec.fieldId == null) {
      return null;
    }

    const { fieldId, cause } = spec;
    const timeoutIds = this.timeoutIdMaps[cause];
    const abortCtrls = this.abortCtrlMaps[cause];

    let timeoutId = timeoutIds.get(fieldId);

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    const abortCtrl = new AbortController();

    abortCtrls.get(fieldId)?.abort();
    abortCtrls.set(fieldId, abortCtrl);

    timeoutId = setTimeout(async () => {
      if (abortCtrl.signal.aborted) {
        return;
      }

      timeoutIds.delete(fieldId);

      this.meta.set({ isValidating: true });

      await this._validateAsync(spec, abortCtrl);

      if (abortCtrls.get(fieldId) === abortCtrl) {
        abortCtrls.delete(fieldId);
      }

      this.meta.set({
        isValidating: this.runningValidatorMap.isAnyRunning(),
      });
    }, this.asyncDebounceMs);

    timeoutIds.set(fieldId, timeoutId);

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
      console.error(`Field ${field} not found in form values`);
      return false;
    }

    const oldFieldValue = get(oldValues as AnyObject, field);
    const replacesArray = Array.isArray(oldFieldValue) || Array.isArray(value);
    const arrayId = replacesArray
      ? this.fieldIdRegistry.prepareArray(
          field,
          this._values,
          Array.isArray(oldFieldValue) ? oldFieldValue.length : 0,
        )
      : null;

    // Remove old array items
    if (arrayId != null) {
      const removedItemIds = this.fieldIdRegistry.replace(
        arrayId,
        Array.isArray(value) ? value.length : 0,
      );

      for (const removedItemId of removedItemIds) {
        this.removeFieldIdState(removedItemId);
      }
    }

    const {
      dontTouch = false,
      dontDirty = false,
      dontValidate = false,
      cause = DEFAULT_CHANGE_CAUSE,
    } = options;

    // TOCHECK
    const presentFields = collectFieldPaths(value, field, [field]);
    const notifiedFields = new Set<DeepKeys<TFormValues>>(presentFields);

    if (replacesArray) {
      collectFieldPaths(oldFieldValue, field, [field]).forEach((subField) =>
        notifiedFields.add(subField as DeepKeys<TFormValues>),
      );

      for (const subscribedField of [...this.fieldSubjects.keys(), ...this.valueSubjects.keys()]) {
        if (subscribedField === field || subscribedField.startsWith(`${field}.`)) {
          notifiedFields.add(subscribedField);
        }
      }
    }

    if (dontValidate) {
      for (const subField of notifiedFields) {
        const subFieldValue = this.getFieldValue(subField);
        const isPresent = presentFields.includes(subField);
        const meta = this.getFieldMeta(subField);
        const newMeta: FieldMeta<TFormValues> = isPresent
          ? {
              ...meta,
              isTouched: dontTouch ? meta.isTouched : true,
              isDirty: dontDirty ? meta.isDirty : true,
              isValidating: false,
            }
          : DEFAULT_META;
        // TOCHECK

        this.updateAndNotifyField(subField, {
          value: subFieldValue,
          meta: newMeta,
        });
        this.valueSubjects.get(subField)?.next({
          value: subFieldValue,
          oldValue: get(oldValues as AnyObject, subField),
          form: this,
          cause,
        });
      }

      this.syncMeta();

      return true;
    }

    // ===== VALIDATE =====

    const asyncValidateSpecs: AsyncValidationSpec<TFormValues, DeepKeys<TFormValues>>[] = [];

    // TOCHECK
    for (const subField of presentFields) {
      // TOCHECK
      const subFieldValue = this.getFieldValue(subField);

      const validationSpec = this.validationSpec("change", subField, subFieldValue);
      const meta = this._validateSync(validationSpec, {
        shouldBlur: false,
        shouldTouch: !dontTouch,
        shouldDirty: !dontDirty,
      });

      this.updateAndNotifyField(subField, {
        value: subFieldValue,
        meta,
      });

      this.valueSubjects.get(subField)?.next({
        value: subFieldValue,
        oldValue: get(oldValues as AnyObject, subField),
        form: this,
        cause,
      });

      // TODO add an option to validate async even if there are sync errors
      if (meta.errors.change.length > 0) {
        continue;
      }

      asyncValidateSpecs.push(this.asyncValidationSpec("change", subField, subFieldValue));
    }

    // TOCHECK
    for (const subField of notifiedFields) {
      if (presentFields.includes(subField)) {
        continue;
      }

      const subFieldValue = this.getFieldValue(subField);

      this.updateAndNotifyField(subField, {
        value: subFieldValue,
        meta: DEFAULT_META,
      });
      this.valueSubjects.get(subField)?.next({
        value: subFieldValue,
        oldValue: get(oldValues as AnyObject, subField),
        form: this,
        cause,
      });
    }
    // TOCHECK

    this.syncMeta();

    // ===== ASYNC VALIDATION =====

    for (const spec of asyncValidateSpecs) {
      this.scheduleAsyncValidation(spec);
    }

    return true;
  };

  /**
   * @public
   */
  setFieldMeta = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    updater: Updater<FieldMeta<TFormValues>>,
  ) => {
    const newMeta = typeof updater === "function" ? updater(this.getFieldMeta(field)) : updater;

    this.updateAndNotifyField(field, {
      meta: newMeta,
    });

    this.syncMeta();
  };

  /**
   * TODO public
   */
  isFieldError = <TField extends DeepKeys<TFormValues>>(field: TField) => {
    const { errors } = this.getFieldMeta(field);

    return ERROR_CAUSES.some((cause) => {
      return errors[cause].length > 0;
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

      const validationSpec = this.validationSpec(cause, field);
      const errors = this._runSyncValidator(validationSpec);

      if (errors.length > 0) {
        isValid = false;

        update.meta = {
          ...update.meta,
          errors: {
            ...update.meta.errors,
            [cause]: errors,
          },
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

      for (const fieldId of this.fieldMetaMap.keys()) {
        const field = this.fieldKeyFrom(fieldId);

        if (field == null) {
          continue;
        }

        if (this.isFieldError(field)) {
          // TOCHECK why not fieldMetaMap.entries() to get meta then access errors?
          // errors[field] = meta.errors;
          errors[field] = this.getFieldMeta(field).errors;
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
      const timeoutIds = this.timeoutIdMaps[cause];
      const abortCtrls = this.abortCtrlMaps[cause];

      for (const timeoutId of timeoutIds.values()) {
        clearTimeout(timeoutId);
      }

      for (const abortCtrl of abortCtrls.values()) {
        abortCtrl.abort();
      }

      timeoutIds.clear();
      abortCtrls.clear();
    }

    this.runningValidatorMap = new RunningValidatorMap();

    this.fieldMetaMap.clear();
    this.fieldIdRegistry.clear();

    const values = cache((field: DeepKeys<TFormValues>) => this.getFieldValue(field));

    for (const [field, subject] of this.fieldSubjects.entries()) {
      subject.next({
        value: values.get(field),
        meta: this.getFieldMeta(field),
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
