import { RunningValidatorMap } from "./RunningValidatorMap";
import type {
  AnyObject,
  AsyncValidatorMap,
  DeepKeys,
  DeepValue,
  FieldApi,
  FieldError,
  FieldErrors,
  FieldMeta,
  FormAsyncValidators,
  FormValidators,
  Updater,
  ValidationCause,
  ValidatorMap,
} from "./types";

import { clone } from "./utils/clone";
import { createSubject, Subject } from "./utils/createSubject";
import { get } from "./utils/get";
import { set } from "./utils/set";
import { transformErrors } from "./utils/transformErrors";

export interface FormMeta extends FieldMeta {}

type FieldSubjects<TFormValues, TKey extends DeepKeys<TFormValues>> = Map<
  TKey,
  Subject<FieldApi<TFormValues, TKey>>
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
}

export class FormControl<TFormValues> {
  _defaultValues: TFormValues;
  _values: TFormValues;
  /**
   * @public
   */
  meta: FormMeta;

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

  metaSubject = createSubject<FormMeta>();
  fieldSubjects: FieldSubjects<TFormValues, DeepKeys<TFormValues>> = new Map();

  constructor({
    defaultValues,
    changeValidators,
    changeAsyncValidators,
    blurValidators,
    blurAsyncValidators,
    asyncDebounceMs = 300,
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
    this.meta = {
      isTouched: false,
      isDirty: false,
      isValidating: false,
    };
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
    return (
      this.fieldMetaMap.get(field) || {
        isTouched: false,
        isDirty: false,
        isValidating: false,
      }
    );
  }

  /**
   * @public
   */
  getFieldErrorMap<TField extends DeepKeys<TFormValues>>(field: TField) {
    return (this.fieldErrorMap.get(field) || {
      change: [],
      blur: [],
      changeAsync: [],
      blurAsync: [],
    }) as FieldErrors<TField>;
  }

  /**
   * @public
   */
  subscribeField<TField extends DeepKeys<TFormValues>>(
    key: TField,
    subscriber: (field: FieldApi<TFormValues, TField>) => void,
  ) {
    let subject = this.fieldSubjects.get(key);

    if (subject === undefined) {
      subject = createSubject();

      this.fieldSubjects.set(key, subject);
    }

    return (subject as Subject<FieldApi<TFormValues, TField>>).subscribe(subscriber);
  }

  /**
   * @public
   */
  subscribeMeta(subscriber: (meta: FormMeta) => void) {
    return this.metaSubject.subscribe(subscriber);
  }

  nextFieldState<TField extends DeepKeys<TFormValues>>(
    field: TField,
    newState: Partial<FieldApi<TFormValues, TField>>,
  ) {
    const {
      value = this.getFieldValue(field),
      meta = this.getFieldMeta(field),
      errorMap = this.getFieldErrorMap(field),
    } = newState;

    this.fieldSubjects.get(field)?.next({
      value,
      meta,
      errorMap,
    });

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

    this.meta = {
      isTouched,
      isDirty,
      isValidating,
    };

    this.metaSubject.next(this.meta);
  }

  async validateAsync<TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    validator: NonNullable<FormAsyncValidators<TFormValues>[TField]>,
    abortCtrl: AbortController,
  ) {
    if (abortCtrl.signal.aborted) return;

    const value = this.getFieldValue(field);
    let errors: FieldError<TField>[] | undefined;

    try {
      this.runningValidatorMap.add(field, cause);

      const currentMeta = this.getFieldMeta(field);

      if (!currentMeta.isValidating) {
        const newMeta: FieldMeta = {
          ...currentMeta,
          isValidating: true,
        };

        this.fieldMetaMap.set(field, newMeta);

        this.nextFieldState(field, { meta: newMeta });
      }

      const rawErrors = await validator({ value });

      if (abortCtrl.signal.aborted) return;

      errors = transformErrors(field, `${cause}Async`, rawErrors);
    } catch (e) {
      // TODO handle error
      console.error(e);
    }

    this.runningValidatorMap.remove(field, cause);

    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      changeAsync: errors,
    };
    const newMeta: FieldMeta = {
      ...this.getFieldMeta(field),
      isValidating: this.runningValidatorMap.isAnyRunning(field),
    };

    this.fieldErrorMap.set(field, newErrorMap);
    this.fieldMetaMap.set(field, newMeta);

    this.nextFieldState(field, {
      meta: newMeta,
      errorMap: newErrorMap,
    });
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
  ) {
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

    // ===== META =====

    const { dontTouch = false, dontDirty = false, dontValidate = false } = options;

    const meta = this.getFieldMeta(field);
    const newMeta: FieldMeta = {
      isTouched: dontTouch ? meta.isTouched : true,
      isDirty: dontDirty ? meta.isDirty : true,
      isValidating: false,
    };

    if (dontValidate) {
      this.fieldMetaMap.set(field, newMeta);

      this.nextFieldState(field, {
        value,
        meta: newMeta,
      });

      return true;
    }

    // ===== ERRORS =====

    const errors = transformErrors(
      field,
      "change",
      this.validators.change[field]?.({
        value,
      }),
    );

    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      change: errors,
    };

    this.fieldErrorMap.set(field, newErrorMap);

    // ===== ASYNC VALIDATE =====

    const changeAsyncValidator = this.asyncValidators.change[field];

    // TODO add an option to validate async even if there are sync errors
    if (errors.length === 0 && changeAsyncValidator != null) {
      const abortCtrl = new AbortController();

      this.abortCtrlMaps.change.set(field, abortCtrl);

      timeoutId = setTimeout(() => {
        this.validateAsync(field, "change", changeAsyncValidator, abortCtrl);
      }, this.asyncDebounceMs);

      this.timeoutIdMaps.change.set(field, timeoutId);
    }

    // ===== CONCLUSION =====

    this.fieldMetaMap.set(field, newMeta);

    this.nextFieldState(field, {
      value,
      meta: newMeta,
      errorMap: newErrorMap,
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

    this.fieldMetaMap.set(field, newMeta);

    this.nextFieldState(field, {
      meta: newMeta,
    });
  }
}

export type FormApi<TFormValues> = Pick<
  FormControl<TFormValues>,
  | "getFieldValue"
  | "getFieldMeta"
  | "getFieldErrorMap"
  | "subscribeField"
  | "subscribeMeta"
  | "setFieldValue"
  | "setFieldMeta"
  | "values"
  | "meta"
>;
