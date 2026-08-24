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
    notifiedFields: string[],
    options: ArrayUpdateOptions,
  ): TItemValue[] | null => {
    const { form, name } = this;
    const oldValues = clone(form._values);
    const success = set(form._values as AnyObject, name, newValue);

    // console.log("====", success);
    // console.log(newValue);
    // console.log(oldValue);
    // console.log(oldValues);
    // console.log(notifiedFields);

    if (!success) {
      return null;
    }

    const { dontValidate = false, cause = DEFAULT_CHANGE_CAUSE } = options;

    notifiedFields = dontValidate ? notifiedFields.concat(name) : notifiedFields;

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

    const validationSpec = form.validationSpec("change", name);
    const { meta, errors, errorMap } = form._validateSync(validationSpec, {
      shouldBlur: false,
      shouldTouch: true,
      shouldDirty: true,
    });

    form.updateAndNotifyField(name, {
      value: newValue as DeepValue<TFormValues, TField>,
      meta,
      errorMap,
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

    const notifiedFields = collectFieldPaths(value, `${name}.${insertIndex}`);

    return this.update(arrayValue, currentValue, notifiedFields, options);
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

    const notifiedFields = collectFieldPaths(removedItem, `${name}.${index}`);

    return this.update(newValue, currentValue, notifiedFields, options);
  };

  /**
   * @public
   */
  move = (
    fromIndex: number,
    toIndex: number,
    options: ArrayUpdateOptions = {},
  ): TItemValue[] | null => {
    const { name } = this;
    const currentValue = this.resolvedValue;

    if (currentValue == null) {
      return null;
    }

    if (
      fromIndex < 0 ||
      fromIndex >= currentValue.length ||
      toIndex < 0 ||
      toIndex >= currentValue.length
    ) {
      return null;
    }

    if (fromIndex === toIndex) {
      return currentValue;
    }

    const newValue = [...currentValue];
    const [item] = newValue.splice(fromIndex, 1);
    newValue.splice(toIndex, 0, item);

    const minIndex = Math.min(fromIndex, toIndex);
    const maxIndex = Math.max(fromIndex, toIndex);
    const notifiedFields: string[] = [];

    for (let i = minIndex; i <= maxIndex; i++) {
      collectFieldPaths(newValue[i], `${name}.${i}`, notifiedFields);
    }

    return this.update(newValue, currentValue, notifiedFields, options);
  };

  /**
   * @public
   */
  swap = (
    indexA: number,
    indexB: number,
    options: ArrayUpdateOptions = {},
  ): TItemValue[] | null => {
    const { name } = this;
    const currentValue = this.resolvedValue;

    if (currentValue == null) {
      return null;
    }

    if (
      indexA < 0 ||
      indexA >= currentValue.length ||
      indexB < 0 ||
      indexB >= currentValue.length
    ) {
      return null;
    }

    if (indexA === indexB) {
      return currentValue;
    }

    const newValue = [...currentValue];
    const temp = newValue[indexA];
    newValue[indexA] = newValue[indexB];
    newValue[indexB] = temp;

    const notifiedFields: string[] = [];

    collectFieldPaths(newValue[indexA], `${name}.${indexA}`, notifiedFields);
    collectFieldPaths(newValue[indexB], `${name}.${indexB}`, notifiedFields);

    return this.update(newValue, currentValue, notifiedFields, options);
  };
}
