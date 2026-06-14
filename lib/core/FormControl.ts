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

import { DEFAULT_ERROR_MAP, DEFAULT_FIELD_META } from "./constants";
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
    return this.fieldMetaMap.get(field) || { ...DEFAULT_FIELD_META };
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
    let isTouched = false;
    let isDirty = false;
    let isValidating = false;

    for (const meta of this.fieldMetaMap.values()) {
      isValidating = isValidating || meta.isValidating;
      isTouched = isTouched || meta.isTouched;
      isDirty = isDirty || meta.isDirty;

      if (isTouched && isDirty && isValidating) {
        break;
      }
    }

    this.meta.set({
      isTouched,
      isDirty,
      isValidating,
    });
  }

  updateAndNotifyField<TField extends DeepKeys<TFormValues>>(
    field: TField,
    changes: Partial<FieldState<TFormValues, TField>>,
  ) {
    let { value, meta, errorMap } = changes;

    if (value === undefined) {
      value = this.getFieldValue(field);
    }

    if (meta === undefined) {
      meta = this.getFieldMeta(field);
    } else {
      this.fieldMetaMap.set(field, meta);
    }

    if (errorMap === undefined) {
      errorMap = this.getFieldErrorMap(field);
    } else {
      this.fieldErrorMap.set(field, errorMap);
    }

    this.fieldSubjects.get(field)?.next({
      value,
      meta,
      errorMap,
    });
  }

  /**
   * @public
   */
  setFieldMeta<TField extends DeepKeys<TFormValues>>(field: TField, updater: Updater<FieldMeta>) {
    let newMeta: FieldMeta;

    if (typeof updater === "function") {
      const currentMeta = this.getFieldMeta(field);

      newMeta = updater(currentMeta);
    } else {
      newMeta = updater;
    }

    this.updateAndNotifyField(field, {
      meta: newMeta,
    });

    this.syncMeta();
  }

  _validateSync<TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    options: {
      dontTouch?: boolean;
    } = {},
  ): FieldError<TField>[] {
    const validator = this.validators[cause][field];
    if (validator == null) return [];

    const value = this.getFieldValue(field);
    const errors = transformErrors(field, cause, validator({ value }));

    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      [cause]: errors,
    };

    const newMeta: FieldMeta | undefined = options.dontTouch
      ? undefined
      : {
          ...this.getFieldMeta(field),
          isTouched: true,
        };

    this.updateAndNotifyField(field, {
      value,
      meta: newMeta,
      errorMap: newErrorMap,
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
      const currentMeta = this.getFieldMeta(field);

      if (!currentMeta.isValidating) {
        const newMeta: FieldMeta = {
          ...currentMeta,
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
    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      [errorCause]: errors,
    };
    const newMeta: FieldMeta = {
      ...this.getFieldMeta(field),
      isValidating: this.runningValidatorMap.isAnyRunning(field),
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
    const sucess = set(this._values as AnyObject, field, value);

    if (!sucess) {
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
      isTouched: dontTouch ? meta.isTouched : true,
      isDirty: dontDirty ? meta.isDirty : true,
      isValidating: false,
    };

    if (dontValidate) {
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

    this.fieldMetaMap.set(field, newMeta);
    // Reset all errors even errors by other causes
    // because those errors are for the old value.
    // This behaviour is different from tanstack form v1.33.0 who kept blur errors.
    this.fieldErrorMap.set(field, { ...DEFAULT_ERROR_MAP });

    const errors = this._validateSync(field, "change", {
      dontTouch: true,
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
    let isValid = true;

    for (const field of Object.keys(this.validators.change) as DeepKeys<TFormValues>[]) {
      const errors = this._validateSync(field, "change");

      if (errors.length > 0) {
        isValid = false;
      }
    }

    for (const field of Object.keys(this.validators.blur) as DeepKeys<TFormValues>[]) {
      const errors = this._validateSync(field, "blur");

      if (errors.length > 0) {
        isValid = false;
      }
    }

    this.meta.set({ isTouched: true });

    if (isValid) {
      this.onSubmit?.({ values: this._values });
    } else {
      this.onSubmitFailed?.();
    }
  };
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
> & {
  handleSubmit(): void;
};
