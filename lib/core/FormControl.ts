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

    return transformErrors(
      spec.field,
      spec.cause,
      spec.validator({ value: spec.value, form: this }),
    );
  };

  _runAsyncValidator = async <TField extends DeepKeys<TFormValues>>(
    spec: AsyncValidationSpec<TFormValues, TField>,
  ): Promise<FieldError<TField>[]> => {
    if (spec.validator == null) return [];

    let result: ValidationResult;

    try {
      result = await spec.validator({ value: spec.value, form: this });
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
    let errorMap = this.getFieldErrorMap(field);

    if (errors.length || errorMap[cause].length) {
      errorMap = {
        ...errorMap,
        [cause]: errors,
      };
    }

    return {
      meta: metaPatcher.value,
      errors,
      errorMap,
    };
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
    const validationSpec = this.validationSpec(cause, field);
    const { meta, errors, errorMap } = this._validateSync(validationSpec, {
      shouldBlur,
      shouldTouch,
      shouldDirty,
    });

    const updated = this.updateAndNotifyField(field, {
      meta,
      errorMap,
    });

    if (updated) {
      this.syncMeta();
    }

    return errors;
  };

  _validateAsync = async <TField extends DeepKeys<TFormValues>>(
    spec: AsyncValidationSpec<TFormValues, TField>,
    abortCtrl: AbortController,
  ): Promise<FieldError<TField>[]> => {
    if (spec.validator == null) {
      return [];
    }

    const { field, cause } = spec;

    this.runningValidatorMap.add(field, cause);

    {
      // Turn on isValidating
      const { success, result } = update(this.getFieldMeta(field), "isValidating", true);

      if (success) {
        this.updateAndNotifyField(field, { meta: result });
      }
    }

    const errors = await this._runAsyncValidator(spec);

    if (abortCtrl.signal.aborted) {
      return [];
    }

    this.runningValidatorMap.remove(field, cause);

    // Update field state

    const metaUpdate = update(
      this.getFieldMeta(field),
      "isValidating",
      this.runningValidatorMap.isAnyRunning(field),
    );

    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      [`${cause}Async`]: errors,
    };

    this.updateAndNotifyField(field, {
      meta: metaUpdate.result,
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
    const timeoutIds = this.timeoutIdMaps[cause];

    clearTimeout(timeoutIds.get(field));
    timeoutIds.delete(field);

    const abortCtrls = this.abortCtrlMaps[cause];
    const abortCtrl = new AbortController();

    abortCtrls.get(field)?.abort();
    abortCtrls.set(field, abortCtrl);

    this.meta.set({ isValidating: true });

    const validationSpec = this.asyncValidationSpec(cause, field);
    const errors = await this._validateAsync(validationSpec, abortCtrl);

    this.meta.set({
      isValidating: this.runningValidatorMap.isAnyRunning(field),
    });

    return errors;
  };

  scheduleAsyncValidation = <TField extends DeepKeys<TFormValues>>(
    spec: AsyncValidationSpec<TFormValues, TField>,
  ) => {
    if (spec.validator == null) {
      return null;
    }

    const { field, cause } = spec;
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

      await this._validateAsync(spec, abortCtrl);

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

    const asyncValidateSpecs: AsyncValidationSpec<TFormValues, DeepKeys<TFormValues>>[] = [];

    for (const subField of subFields) {
      const subFieldValue = this.getFieldValue(subField);

      const validationSpec = this.validationSpec("change", subField, subFieldValue);
      const { meta, errors, errorMap } = this._validateSync(validationSpec, {
        shouldBlur: false,
        shouldTouch: !dontTouch,
        shouldDirty: !dontDirty,
      });

      this.updateAndNotifyField(subField, {
        value: subFieldValue,
        meta,
        errorMap,
      });

      this.valueSubjects.get(subField)?.next({
        value: subFieldValue,
        oldValue: get(oldValues as AnyObject, subField),
        form: this,
        cause,
      });

      // TODO add an option to validate async even if there are sync errors
      if (errors.length > 0) {
        continue;
      }

      asyncValidateSpecs.push(this.asyncValidationSpec("change", subField, subFieldValue));
    }

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
    updater: Updater<FieldMeta>,
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

      const validationSpec = this.validationSpec(cause, field);
      const errors = this._runSyncValidator(validationSpec);

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
