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

type TimeoutIDs<TKey> = Map<TKey, NodeJS.Timeout>;

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
    cause: ValidationCause,
    field: TField,
  ) {
    const value = this.getFieldValue(field);
    const errors = await this.asyncValidatorMap[cause][field]?.({ value });

    const error = this.transformErrors(field, `${cause}Async`, errors);


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
      return false;
    }

    const changeAsyncValidator = this.asyncValidatorMap.change[field];

    // ===== ERRORS =====

    const errors = this.validatorMap.change[field]?.({ value });
    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      change: this.transformErrors(field, "change", errors),
    };

    this.fieldErrorMap.set(field, newErrorMap);

    if (changeAsyncValidator != null) {
      // clearTimeout(this.changeTimeoutIDs.get(field));

      // const timeout = setTimeout(() => {
      //   const errors = changeAsyncValidator({ value });
      //   const newErrorMap: FieldErrors<TField> = {
      //     ...this.getFieldErrorMap(field),
      //     changeAsync: this.transformErrors(field, "changeAsync", errors),
      //   };
      //   this.fieldErrorMap.set(field, newErrorMap);
      // }, this.asyncDebounceMs);

      // this.changeTimeoutIDs.set(field, timeout);
    }

    // ===== META =====

    const { dontTouch = false, dontDirty = false, dontValidate = false } = options;
    const meta = this.getFieldMeta(field);
    const newMeta: FieldMeta = {
      isTouched: dontTouch ? meta.isTouched : true,
      isDirty: dontDirty ? meta.isDirty : true,
      // isValidating: changeAsyncValidator !== undefined,
    };

    this.fieldMetaMap.set(field, newMeta);

    if (dontValidate) {
      return true;
    }

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
