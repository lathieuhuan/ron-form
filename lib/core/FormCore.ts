import type {
  AnyObject,
  AsyncValidator,
  AsyncValidatorMap,
  DeepKeys,
  DeepValue,
  FieldErrors,
  FieldMeta,
  FieldState,
  FormAsyncValidators,
  FormValidators,
  ValidationCause,
  Validator,
  ValidatorMap,
} from "./types";

import { DEFAULT_ERROR_MAP, DEFAULT_META } from "./constants";
import { FormMetaControl } from "./FormMetaControl";
import { RunningValidatorMap } from "./RunningValidatorMap";
import { clone } from "./utils/clone";
import { createSubject, Observer, Subject } from "./utils/createSubject";
import { get } from "./utils/object";
import { toWildCardDeepKey } from "./utils/toWildCardDeepKey";

type FieldSubjects<TFormValues, TKey extends DeepKeys<TFormValues>> = Map<
  TKey,
  Subject<FieldState<TFormValues, TKey>>
>;

type TimeoutIdMapByCause<TFormValues> = {
  [key in ValidationCause]: Map<DeepKeys<TFormValues>, NodeJS.Timeout>;
};

type AbortControllerMapByCause<TFormValues> = {
  [key in ValidationCause]: Map<DeepKeys<TFormValues>, AbortController>;
};

export type ValidationSpec<TFormValues, TField extends DeepKeys<TFormValues>> = {
  cause: ValidationCause;
  field: TField;
  value: DeepValue<TFormValues, TField>;
  validator: Validator<TFormValues, TField> | undefined;
};

export type AsyncValidationSpec<TFormValues, TField extends DeepKeys<TFormValues>> = {
  cause: ValidationCause;
  field: TField;
  value: DeepValue<TFormValues, TField>;
  validator: AsyncValidator<TFormValues, TField> | undefined;
};

export interface FormCoreOptions<TFormValues> {
  defaultValues?: TFormValues;
  changeValidators?: FormValidators<TFormValues>;
  changeAsyncValidators?: FormAsyncValidators<TFormValues>;
  blurValidators?: FormValidators<TFormValues>;
  blurAsyncValidators?: FormAsyncValidators<TFormValues>;
  asyncDebounceMs?: number;
}

export class FormCore<TFormValues> {
  _defaultValues: TFormValues;
  _values: TFormValues;
  meta: FormMetaControl;

  fieldMetaMap: Map<DeepKeys<TFormValues>, FieldMeta> = new Map();
  fieldErrorMap: Map<DeepKeys<TFormValues>, FieldErrors<DeepKeys<TFormValues>>> = new Map();

  asyncDebounceMs: number;

  validators: ValidatorMap<TFormValues>;
  asyncValidators: AsyncValidatorMap<TFormValues>;

  timeoutIdMaps: TimeoutIdMapByCause<TFormValues> = {
    change: new Map(),
    blur: new Map(),
  };
  abortCtrlMaps: AbortControllerMapByCause<TFormValues> = {
    change: new Map(),
    blur: new Map(),
  };
  runningValidatorMap = new RunningValidatorMap<TFormValues>();

  fieldSubjects: FieldSubjects<TFormValues, DeepKeys<TFormValues>> = new Map();

  constructor({
    defaultValues,
    changeValidators,
    changeAsyncValidators,
    blurValidators,
    blurAsyncValidators,
    asyncDebounceMs = 300,
  }: FormCoreOptions<TFormValues> = {}) {
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
  }

  get values() {
    return this._values;
  }

  validationSpec = <TField extends DeepKeys<TFormValues>>(
    cause: ValidationCause,
    field: TField,
    value: DeepValue<TFormValues, TField> = this.getFieldValue(field),
  ): ValidationSpec<TFormValues, TField> => {
    const validatorKey = toWildCardDeepKey<TFormValues>(field);

    return {
      cause,
      field,
      value,
      validator: this.validators[cause][validatorKey],
    };
  };

  asyncValidationSpec = <TField extends DeepKeys<TFormValues>>(
    cause: ValidationCause,
    field: TField,
    value: DeepValue<TFormValues, TField> = this.getFieldValue(field),
  ): AsyncValidationSpec<TFormValues, TField> => {
    const validatorKey = toWildCardDeepKey<TFormValues>(field);

    return {
      cause,
      field,
      value,
      validator: this.asyncValidators[cause][validatorKey],
    };
  };

  /**
   * @public
   */
  getFieldValue = <TField extends DeepKeys<TFormValues>>(
    field: TField,
  ): DeepValue<TFormValues, TField> => {
    return get(this._values as AnyObject, field);
  };

  /**
   * @public
   */
  getFieldMeta = <TField extends DeepKeys<TFormValues>>(field: TField): FieldMeta => {
    let meta = this.fieldMetaMap.get(field);

    if (!meta) {
      meta = { ...DEFAULT_META };
      this.fieldMetaMap.set(field, meta);
    }

    return meta;
  };

  /**
   * @public
   */
  getFieldErrorMap = <TField extends DeepKeys<TFormValues>>(field: TField): FieldErrors<TField> => {
    let errorMap: FieldErrors<any> | undefined = this.fieldErrorMap.get(field);

    if (!errorMap) {
      errorMap = { ...DEFAULT_ERROR_MAP };
      this.fieldErrorMap.set(field, errorMap);
    }

    return errorMap;
  };

  /**
   * @public
   */
  getFieldState = <TField extends DeepKeys<TFormValues>>(
    field: TField,
  ): FieldState<TFormValues, TField> => {
    return {
      value: this.getFieldValue(field),
      meta: this.getFieldMeta(field),
      errorMap: this.getFieldErrorMap(field),
    };
  };

  /**
   * @public
   */
  subscribeField = <TField extends DeepKeys<TFormValues>>(
    key: TField,
    subscriber: Observer<FieldState<TFormValues, TField>>,
  ) => {
    const subject = this.fieldSubjects.get(key) || createSubject();

    this.fieldSubjects.set(key, subject);

    return (subject as Subject<FieldState<TFormValues, TField>>).subscribe(subscriber);
  };

  /**
   * If `value` is not passed AND
   * (`meta` & `errorMap` are not passed/undefined OR
   * `meta` & `errorMap` are the same as the current ones),
   * this method will short circuit.
   */
  updateAndNotifyField = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    changes: Partial<FieldState<TFormValues, TField>>,
  ) => {
    let { meta, errorMap } = changes;
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
    const value = valueChanged
      ? (changes.value as DeepValue<TFormValues, TField>)
      : this.getFieldValue(field);

    this.fieldMetaMap.set(field, meta);
    this.fieldErrorMap.set(field, errorMap);

    this.fieldSubjects.get(field)?.next({
      value,
      meta,
      errorMap,
    });
  };

  syncMeta = () => {
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
  };
}
