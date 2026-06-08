import type {
  AnyObject,
  AsyncValidator,
  AsyncValidatorMap,
  DeepKeys,
  DeepValue,
  ErrorCauseType,
  Field,
  FieldError,
  FieldErrors,
  FieldMeta,
  FormAsyncValidators,
  FormValidators,
  ValidationCause,
  ValidatorMap,
} from "./types";

import { clone } from "./utils/clone";
import { createSubject, Subject } from "./utils/createSubject";
import { get } from "./utils/get";
import { set } from "./utils/set";

type FieldSubjects<TFormValues, TKey extends DeepKeys<TFormValues>> = Map<
  TKey,
  Subject<Field<TFormValues, TKey>>
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
  private _defaultValues: TFormValues;
  private _values: TFormValues;
  private fieldMetaMap: Map<DeepKeys<TFormValues>, FieldMeta> = new Map();
  private fieldErrorMap: Map<DeepKeys<TFormValues>, FieldErrors<DeepKeys<TFormValues>>> = new Map();

  private asyncDebounceMs: number;

  private validatorMap: ValidatorMap<TFormValues>;
  private asyncValidatorMap: AsyncValidatorMap<TFormValues>;

  private timeoutIdMap: TimeoutIDMapByCause<TFormValues> = {
    change: new Map(),
    blur: new Map(),
  };
  private abortCtrlMap: AbortControllerMapByCause<TFormValues> = {
    change: new Map(),
    blur: new Map(),
  };

  private fieldSubjects: FieldSubjects<TFormValues, DeepKeys<TFormValues>> = new Map();

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

    this.validatorMap = {
      change: changeValidators !== undefined ? changeValidators : {},
      blur: blurValidators !== undefined ? blurValidators : {},
    };
    this.asyncValidatorMap = {
      change: changeAsyncValidators !== undefined ? changeAsyncValidators : {},
      blur: blurAsyncValidators !== undefined ? blurAsyncValidators : {},
    };

    this.asyncDebounceMs = asyncDebounceMs;
  }

  get values() {
    return this._values;
  }

  getFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
  ): DeepValue<TFormValues, TField> {
    return get(this._values as AnyObject, field);
  }

  getFieldMeta<TField extends DeepKeys<TFormValues>>(field: TField) {
    return (this.fieldMetaMap.get(field) || DEFAULT_FIELD_META) as FieldMeta;
  }

  getFieldErrorMap<TField extends DeepKeys<TFormValues>>(field: TField): FieldErrors<TField> {
    return this.fieldErrorMap.get(field) || DEFAULT_FIELD_ERROR_MAP;
  }

  subscribe<TField extends DeepKeys<TFormValues>>(key: TField) {
    let subject = this.fieldSubjects.get(key);

    if (subject === undefined) {
      subject = createSubject();

      this.fieldSubjects.set(key, subject);
    }
    return (subject as Subject<Field<TFormValues, TField>>).subscribe;
  }

  private transformErrors<TField extends DeepKeys<TFormValues>>(
    field: TField,
    type: ErrorCauseType,
    messages: string | string[] | null | undefined,
  ) {
    const errors = typeof messages === "string" ? [messages] : messages == null ? [] : messages;

    return errors.map<FieldError<TField>>((error) => ({
      path: field,
      type,
      message: error,
      meta: {},
    }));
  }

  private async validateAsync<TField extends DeepKeys<TFormValues>>(
    field: TField,
    cause: ValidationCause,
    validator: NonNullable<FormAsyncValidators<TFormValues>[TField]>,
    abortCtrl: AbortController,
  ) {
    if (abortCtrl.signal.aborted) return;

    const value = this.getFieldValue(field);
    let errors: FieldError<TField>[] | undefined;

    try {
      const rawErrors = await validator({ value });

      if (abortCtrl.signal.aborted) return;

      errors = this.transformErrors(field, `${cause}Async`, rawErrors);
    } catch (e) {
      // TODO handle error
      console.error(e);
    }

    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      changeAsync: errors,
    };
    const newMeta: FieldMeta = {
      ...this.getFieldMeta(field),
      isValidating: false,
    };

    this.fieldErrorMap.set(field, newErrorMap);
    this.fieldMetaMap.set(field, newMeta);

    this.fieldSubjects.get(field)?.next({
      value,
      meta: newMeta,
      errorMap: newErrorMap,
    });
  }

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

    this.abortCtrlMap.change.get(field)?.abort();

    let timeoutId = this.timeoutIdMap.change.get(field);

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

      this.fieldSubjects.get(field)?.next({
        value,
        meta: newMeta,
        errorMap: this.getFieldErrorMap(field),
      });
      return true;
    }

    // ===== ERRORS =====

    const errors = this.transformErrors(
      field,
      "change",
      this.validatorMap.change[field]?.({
        value,
      }),
    );

    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      change: errors,
    };

    this.fieldErrorMap.set(field, newErrorMap);

    // ===== ASYNC VALIDATE =====

    const changeAsyncValidator = this.asyncValidatorMap.change[field];

    // TODO add an option to validate async even if there are sync errors
    if (errors.length === 0 && changeAsyncValidator != null) {
      const abortCtrl = new AbortController();

      newMeta.isValidating = true;
      this.abortCtrlMap.change.set(field, abortCtrl);

      timeoutId = setTimeout(() => {
        this.validateAsync(field, "change", changeAsyncValidator, abortCtrl);
      }, this.asyncDebounceMs);

      this.timeoutIdMap.change.set(field, timeoutId);
    }

    // ===== CONCLUSION =====

    this.fieldMetaMap.set(field, newMeta);

    this.fieldSubjects.get(field)?.next({
      value,
      meta: newMeta,
      errorMap: newErrorMap,
    });
  }

  setFieldMeta<TField extends DeepKeys<TFormValues>>(field: TField, meta: FieldMeta) {
    this.fieldMetaMap.set(field, meta);
  }
}

const DEFAULT_FIELD_META: FieldMeta = {
  isTouched: false,
  isDirty: false,
  isValidating: false,
};

const DEFAULT_FIELD_ERROR_MAP: FieldErrors<any> = {
  change: [],
  blur: [],
  changeAsync: [],
  blurAsync: [],
};
