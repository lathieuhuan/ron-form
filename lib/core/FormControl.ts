import type { AnyObject } from "./types/utils";
import type { DeepKeys, DeepValue } from "./types/key-value";

import { clone } from "./utils/clone";
import { createSubject, Subject } from "./utils/createSubject";
import { get } from "./utils/get";
import { set } from "./utils/set";

// ===== ERRORS =====

export interface ErrorMeta {}

export interface FormError<TKey> {
  path: TKey;
  type: "change" | "blur" | "changeAsync" | "blurAsync";
  message: string;
  meta: ErrorMeta;
}

export interface FieldErrors<TKey> {
  change: FormError<TKey>[];
  blur: FormError<TKey>[];
  changeAsync: FormError<TKey>[];
  blurAsync: FormError<TKey>[];
}

// ===== VALIDATORS =====

type Validator<TValues, TDeepKey> = (args: {
  value: DeepValue<TValues, TDeepKey>;
}) => string | string[] | null | undefined;

type FormValidators<TFormValues> = {
  [K in DeepKeys<TFormValues>]?: Validator<TFormValues, K>;
};

type AsyncValidator<TValues, TDeepKey> = (args: {
  value: DeepValue<TValues, TDeepKey>;
}) => Promise<string | string[] | null | undefined>;

type FormAsyncValidators<TFormValues> = {
  [K in DeepKeys<TFormValues>]?: AsyncValidator<TFormValues, K>;
};

// ===== FIELD =====

export interface FieldMeta {
  /** user has focused and blurred the field */
  isTouched: boolean;
  /** user has changed the value of the field */
  isDirty: boolean;
}

export interface Field<TFormValues, TKey extends DeepKeys<TFormValues>> {
  value: DeepValue<TFormValues, TKey>;
  meta: FieldMeta;
  errorMap: FieldErrors<TKey>;
}

type FieldSubjects<TFormValues, TKey extends DeepKeys<TFormValues>> = Map<
  TKey,
  Subject<Field<TFormValues, TKey>>
>;

export interface FormControlOptions<TFormValues> {
  defaultValues?: TFormValues;
  changeValidators?: FormValidators<TFormValues>;
  changeAsyncValidators?: FormAsyncValidators<TFormValues>;
  blurValidators?: FormValidators<TFormValues>;
  blurAsyncValidators?: FormAsyncValidators<TFormValues>;
}

export class FormControl<TFormValues> {
  private _defaultValues: TFormValues;
  private _values: TFormValues;
  private _meta: Map<DeepKeys<TFormValues>, FieldMeta> = new Map();
  private fieldErrors: Map<DeepKeys<TFormValues>, FieldErrors<DeepKeys<TFormValues>>> = new Map();

  private changeValidators: FormValidators<TFormValues>;
  private changeAsyncValidators: FormAsyncValidators<TFormValues>;
  private blurValidators: FormValidators<TFormValues>;
  private blurAsyncValidators: FormAsyncValidators<TFormValues>;

  private fieldSubjects: FieldSubjects<TFormValues, DeepKeys<TFormValues>> = new Map();

  constructor({
    defaultValues,
    changeValidators,
    changeAsyncValidators,
    blurValidators,
    blurAsyncValidators,
  }: FormControlOptions<TFormValues> = {}) {
    this._defaultValues = defaultValues !== undefined ? clone(defaultValues) : ({} as TFormValues);
    this._values = clone(this._defaultValues);

    this.changeValidators = changeValidators !== undefined ? changeValidators : {};
    this.changeAsyncValidators = changeAsyncValidators !== undefined ? changeAsyncValidators : {};
    this.blurValidators = blurValidators !== undefined ? blurValidators : {};
    this.blurAsyncValidators = blurAsyncValidators !== undefined ? blurAsyncValidators : {};
  }

  get values() {
    return this._values;
  }

  get meta() {
    return this._meta;
  }

  getFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
  ): DeepValue<TFormValues, TField> {
    return get(this._values as AnyObject, field);
  }

  getFieldMeta<TField extends DeepKeys<TFormValues>>(field: TField) {
    return (this._meta.get(field) || DEFAULT_FIELD_META) as FieldMeta;
  }

  getFieldErrorMap<TField extends DeepKeys<TFormValues>>(field: TField): FieldErrors<TField> {
    return this.fieldErrors.get(field) || DEFAULT_FIELD_ERROR_MAP;
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
    type: FormError<TField>["type"],
    messages: string | string[] | null | undefined,
  ) {
    const errors = typeof messages === "string" ? [messages] : messages == null ? [] : messages;
    return errors.map<FormError<TField>>((error) => ({
      path: field,
      type,
      message: error,
      meta: {},
    }));
  }

  setFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
    value: DeepValue<TFormValues, TField>,
    options: {
      dontTouch?: boolean;
      dontDirty?: boolean;
    } = {},
  ) {
    const sucess = set(this._values as AnyObject, field, value);

    if (!sucess) {
      return false;
    }

    // ===== META =====

    const { dontTouch = false, dontDirty = false } = options;
    const meta = this.getFieldMeta(field);
    const newMeta: FieldMeta = {
      isTouched: dontTouch ? meta.isTouched : true,
      isDirty: dontDirty ? meta.isDirty : true,
    };

    this._meta.set(field, newMeta);

    // ===== ERRORS =====

    const errors = this.changeValidators[field]?.({ value });
    const newErrorMap: FieldErrors<TField> = {
      ...this.getFieldErrorMap(field),
      change: this.transformErrors(field, "change", errors),
    };

    this.fieldErrors.set(field, newErrorMap);

    this.fieldSubjects.get(field)?.next({
      value,
      meta: newMeta,
      errorMap: newErrorMap,
    });
  }
}

const DEFAULT_FIELD_META: FieldMeta = {
  isTouched: false,
  isDirty: false,
};

const DEFAULT_FIELD_ERROR_MAP: FieldErrors<any> = {
  change: [],
  blur: [],
  changeAsync: [],
  blurAsync: [],
};
