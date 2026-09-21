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

import { DEFAULT_META, ERROR_CAUSES } from "./constants";
import { FieldId, FieldIdentityRegistry } from "./FieldIdentityRegistry";
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

type TimeoutIdMapByCause = {
  [key in ValidationCause]: Map<FieldId, NodeJS.Timeout>;
};

type AbortControllerMapByCause = {
  [key in ValidationCause]: Map<FieldId, AbortController>;
};

export type ValidationSpec<TFormValues, TField extends DeepKeys<TFormValues>> = {
  cause: ValidationCause;
  field: TField;
  value: DeepValue<TFormValues, TField>;
  validator: Validator<TFormValues, TField> | undefined;
};

export type AsyncValidationSpec<TFormValues, TField extends DeepKeys<TFormValues>> = {
  cause: ValidationCause;
  // TOCHECK do we need field?
  field: TField;
  fieldId: FieldId | null;
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

  fieldMetaMap: Map<FieldId, FieldMeta<TFormValues>> = new Map();
  fieldIdRegistry = new FieldIdentityRegistry<TFormValues>();

  asyncDebounceMs: number;

  validators: ValidatorMap<TFormValues>;
  asyncValidators: AsyncValidatorMap<TFormValues>;

  timeoutIdMaps: TimeoutIdMapByCause = {
    change: new Map(),
    blur: new Map(),
  };
  abortCtrlMaps: AbortControllerMapByCause = {
    change: new Map(),
    blur: new Map(),
  };
  runningValidatorMap = new RunningValidatorMap();

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
      fieldId: this.fieldIdOf(field),
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
  getFieldMeta = <TField extends DeepKeys<TFormValues>>(field: TField): FieldMeta<TFormValues> => {
    const fieldId = this.fieldIdOf(field);

    // TOCHECK when fieldId is null?
    if (fieldId == null) {
      return DEFAULT_META;
    }

    let meta = this.fieldMetaMap.get(fieldId);

    if (!meta) {
      meta = DEFAULT_META;
      this.fieldMetaMap.set(fieldId, meta);
    }

    // TOCHECK can we optimize this implementation?
    let errorsChanged = false;
    const errors = { ...meta.errors };

    for (const cause of ERROR_CAUSES) {
      const currentErrors = errors[cause];

      if (currentErrors.some((error) => error.path !== field)) {
        errors[cause] = currentErrors.map((error) => ({
          ...error,
          path: field,
        }));
        errorsChanged = true;
      }
    }

    if (errorsChanged) {
      meta = {
        ...meta,
        errors,
      };
      this.fieldMetaMap.set(fieldId, meta);
    }

    return meta;
  };

  fieldIdOf = (field: DeepKeys<TFormValues>): FieldId | null => {
    return this.fieldIdRegistry.toFieldId(field, this._values);
  };

  fieldKeyFrom = (fieldId: FieldId): DeepKeys<TFormValues> | null => {
    return this.fieldIdRegistry.toFieldKey(fieldId, this._values);
  };

  // TOCHECK rename
  removeFieldIdState = (prefix: FieldId): void => {
    const isRemoved = (fieldId: FieldId) =>
      this.fieldIdRegistry.isSameOrDescendant(fieldId, prefix);

    for (const fieldId of this.fieldMetaMap.keys()) {
      if (isRemoved(fieldId)) {
        this.fieldMetaMap.delete(fieldId);
      }
    }

    for (const cause of <ValidationCause[]>["change", "blur"]) {
      for (const [fieldKey, timeoutId] of this.timeoutIdMaps[cause]) {
        if (isRemoved(fieldKey)) {
          clearTimeout(timeoutId);
          this.timeoutIdMaps[cause].delete(fieldKey);
        }
      }

      for (const [fieldKey, abortCtrl] of this.abortCtrlMaps[cause]) {
        if (isRemoved(fieldKey)) {
          abortCtrl.abort();
          this.abortCtrlMaps[cause].delete(fieldKey);
        }
      }
    }

    this.runningValidatorMap.removeWhere(isRemoved);
  };

  /**
   * @public
   */
  getFieldErrorMap = <TField extends DeepKeys<TFormValues>>(field: TField): FieldErrors<TField> => {
    return this.getFieldMeta(field).errors as FieldErrors<TField>;
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
   * (`meta` is not passed/undefined OR is the same as the current one),
   * this method will short circuit and return `false`.
   * Otherwise, return `true`.
   */
  // TOCHECK can we use FieldId instead of field?
  updateAndNotifyField = <TField extends DeepKeys<TFormValues>>(
    field: TField,
    changes: Partial<FieldState<TFormValues, TField>>,
  ): boolean => {
    let { meta } = changes;
    const valueChanged = "value" in changes;

    const currentMeta = this.getFieldMeta(field);

    // Note: The meta passed in changes can already be the current one.
    meta = meta === undefined ? currentMeta : meta;

    if (!valueChanged && meta === currentMeta) {
      return false;
    }

    // TODO write test for value === undefined/null (e.g. clear value)
    const value = valueChanged
      ? (changes.value as DeepValue<TFormValues, TField>)
      : this.getFieldValue(field);

    const fieldId = this.fieldIdOf(field);

    if (fieldId != null) {
      this.fieldMetaMap.set(fieldId, meta);
    }

    this.fieldSubjects.get(field)?.next({
      value,
      meta,
    });

    return true;
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
