import type { AnyObject } from "./types/utils";
import type { DeepKeys, DeepValue } from "./types/key-value";

import { clone } from "./utils/clone";
import { createSubject, Subject } from "./utils/createSubject";
import { get } from "./utils/get";
import { set } from "./utils/set";

interface FieldMeta {
  isTouched: boolean;
  isValid: boolean;
}

export interface FormControlProps<TFormValues> {
  defaultValue?: TFormValues;
}

export interface Field<T> {
  value: T;
  meta: FieldMeta;
}

type FieldSubjects<TFormValues, TKey extends DeepKeys<TFormValues>> = Map<
  TKey,
  Subject<Field<DeepValue<TFormValues, TKey>>>
>;

export class FormControl<TFormValues> {
  private _defaultValue: TFormValues;
  private _values: TFormValues;
  private _meta: Map<DeepKeys<TFormValues>, FieldMeta> = new Map();
  private _fieldSubjects: FieldSubjects<TFormValues, DeepKeys<TFormValues>> = new Map();

  constructor({ defaultValue }: FormControlProps<TFormValues> = {}) {
    this._defaultValue = defaultValue !== undefined ? clone(defaultValue) : ({} as TFormValues);
    this._values = clone(this._defaultValue);
  }

  get values() {
    return this._values;
  }

  get meta() {
    return this._meta;
  }

  subscribe<TField extends DeepKeys<TFormValues>>(key: TField) {
    let subject = this._fieldSubjects.get(key);

    if (subject === undefined) {
      subject = createSubject();

      this._fieldSubjects.set(key, subject);
    }
    return (subject as Subject<Field<DeepValue<TFormValues, TField>>>).subscribe;
  }

  setFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
    value: DeepValue<TFormValues, TField>,
  ) {
    const sucess = set(this._values as AnyObject, field, value);

    if (sucess) {
      const meta = this.getFieldMeta(field);

      this._fieldSubjects.get(field)?.next({
        value,
        meta: {
          ...meta,
          isTouched: true,
        },
      });
    }

    return sucess;
  }

  getFieldValue<TField extends DeepKeys<TFormValues>>(
    field: TField,
  ): DeepValue<TFormValues, TField> {
    return get(this._values as AnyObject, field);
  }

  getFieldMeta<TField extends DeepKeys<TFormValues>>(field: TField): FieldMeta {
    return this._meta.get(field) || DEFAULT_FIELD_META;
  }
}

const DEFAULT_FIELD_META: FieldMeta = {
  isTouched: false,
  isValid: false,
};
