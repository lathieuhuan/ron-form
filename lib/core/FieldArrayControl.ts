import type { FormControl } from "./FormControl";
import type { AnyObject, ArrayUpdateOptions, DeepKeys, DeepItemValue, DeepValue } from "./types";

import { DEFAULT_CHANGE_CAUSE } from "./constants";
import { clone } from "./utils/clone";
import { collectFieldPaths, get, set } from "./utils/object";

export class FieldArrayControl<
  TFormValues,
  TField extends DeepKeys<TFormValues>,
  TItemValue = DeepItemValue<TFormValues, TField>,
> {
  name: TField;
  form: FormControl<TFormValues>;

  get value() {
    return this.form.getFieldValue(this.name) as TItemValue[];
  }

  constructor(field: TField, form: FormControl<TFormValues>) {
    this.name = field;
    this.form = form;
  }

  isArrayValue = (value: unknown): value is TItemValue[] => {
    return Array.isArray(value);
  };

  /**
   * @public
   */
  insert = (
    value: TItemValue,
    index?: number,
    options: ArrayUpdateOptions = {},
  ): TItemValue[] | null => {
    const { form, name } = this;
    let currentArrayValue = form.getFieldValue(name);

    if (currentArrayValue == null) {
      currentArrayValue = [] as DeepValue<TFormValues, TField>;
    }
    if (!this.isArrayValue(currentArrayValue)) {
      return null;
    }

    const insertIndex = index ?? currentArrayValue.length;

    if (insertIndex < 0 || insertIndex > currentArrayValue.length) {
      return null;
    }

    const arrayValue = [
      ...currentArrayValue.slice(0, insertIndex),
      value,
      ...currentArrayValue.slice(insertIndex),
    ];

    const success = set(form._values as AnyObject, name, arrayValue);

    if (!success) {
      return null;
    }

    const { dontValidate = false, cause = DEFAULT_CHANGE_CAUSE } = options;
    const oldValues = clone(form._values);
    // also notify this array field if dontValidate
    const notifiedFields = collectFieldPaths(
      value,
      `${name}.${insertIndex}`,
      dontValidate ? [name] : [],
    );

    for (const field of notifiedFields) {
      const value = form.getFieldValue(field);

      form.fieldSubjects.get(field)?.next({
        value,
        meta: form.getFieldMeta(field),
        errorMap: form.getFieldErrorMap(field),
      });
      form.valueSubjects.get(field)?.next({
        value,
        oldValue: get(oldValues as AnyObject, field),
        form,
        cause,
      });
    }

    if (dontValidate) {
      form.syncMeta();

      return arrayValue;
    }

    const errors = form._validateSync(name, "change", {
      shouldTouch: true,
      shouldDirty: true,
    });

    form.valueSubjects.get(name)?.next({
      value: arrayValue as DeepValue<TFormValues, TField>,
      oldValue: currentArrayValue,
      form,
      cause,
    });

    form.syncMeta();

    if (errors.length === 0) {
      form.scheduleAsyncValidation(name, "change");
    }

    return arrayValue;
  };

  remove = () => {
    // TODO
  };
}
