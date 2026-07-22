import type {
  AnyObject,
  AsyncValidatorMap,
  DeepKeys,
  DeepValue,
  FieldErrors,
  FieldMeta,
  FieldState,
  FormAsyncValidators,
  FormMetaApi,
  FormValidators,
  ValidationCause,
  ValidatorMap,
} from "./types";

import { DEFAULT_ERROR_MAP, DEFAULT_META } from "./constants";
import { FormMetaControl } from "./FormMetaControl";
import { RunningValidatorMap } from "./RunningValidatorMap";
import { clone } from "./utils/clone";
import { createSubject, Observer, Subject } from "./utils/createSubject";
import { get } from "./utils/object";

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
    return this.fieldMetaMap.get(field) || { ...DEFAULT_META };
  };

  /**
   * @public
   */
  getFieldErrorMap = <TField extends DeepKeys<TFormValues>>(field: TField) => {
    return (this.fieldErrorMap.get(field) || { ...DEFAULT_ERROR_MAP }) as FieldErrors<TField>;
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
