import type { FormControl } from "./FormControl";
import type { AnyObject, ArrayUpdateOptions, DeepItemValue, DeepKeys, DeepValue } from "./types";

import { DEFAULT_CHANGE_CAUSE } from "./constants";
import { clone } from "./utils/clone";
import { collectFieldPaths } from "./utils/collectFieldPaths";
import { get, set } from "./utils/object";

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

  get resolvedValue(): TItemValue[] | null {
    let value = this.form.getFieldValue(this.name);

    if (value == null) {
      value = [] as DeepValue<TFormValues, TField>;
    }

    if (!this.isArrayValue(value)) {
      return null;
    }

    return value;
  }

  update = (
    newValue: TItemValue[],
    oldValue: TItemValue[],
    affectedItemPath: string,
    affectedItemValue: unknown,
    options: ArrayUpdateOptions,
  ): TItemValue[] | null => {
    const { form, name } = this;
    const success = set(form._values as AnyObject, name, newValue);

    if (!success) {
      return null;
    }

    const { dontValidate = false, cause = DEFAULT_CHANGE_CAUSE } = options;
    const oldValues = clone(form._values);
    const notifiedFields = collectFieldPaths(
      affectedItemValue,
      affectedItemPath,
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

      return newValue;
    }

    const errors = form._validateSync(name, "change", {
      shouldTouch: true,
      shouldDirty: true,
    });

    form.valueSubjects.get(name)?.next({
      value: newValue as DeepValue<TFormValues, TField>,
      oldValue: oldValue as DeepValue<TFormValues, TField>,
      form,
      cause,
    });

    form.syncMeta();

    // TODO add an option to validate async even if there are sync errors
    if (errors.length === 0) {
      form.scheduleAsyncValidation(form.asyncValidationSpec("change", name));
    }

    return newValue;
  };

  /**
   * @public
   */
  insert = (
    value: TItemValue,
    index?: number,
    options: ArrayUpdateOptions = {},
  ): TItemValue[] | null => {
    const { name } = this;
    const currentValue = this.resolvedValue;

    if (currentValue == null) {
      return null;
    }

    const insertIndex = index ?? currentValue.length;

    if (insertIndex < 0 || insertIndex > currentValue.length) {
      return null;
    }

    const arrayValue = [
      ...currentValue.slice(0, insertIndex),
      value,
      ...currentValue.slice(insertIndex),
    ];

    return this.update(arrayValue, currentValue, `${name}.${insertIndex}`, value, options);
  };

  /**
   * @public
   */
  remove = (index: number, options: ArrayUpdateOptions = {}): TItemValue[] | null => {
    const { name } = this;
    const currentValue = this.resolvedValue;

    if (currentValue == null) {
      return null;
    }

    if (index < 0 || index >= currentValue.length) {
      return null;
    }

    const removedItem = currentValue[index];
    const newValue = [...currentValue.slice(0, index), ...currentValue.slice(index + 1)];

    return this.update(newValue, currentValue, `${name}.${index}`, removedItem, options);
  };
}
