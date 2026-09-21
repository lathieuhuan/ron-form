import type { FieldId } from "./FieldIdentityRegistry";
import type { FormControl } from "./FormControl";
import type { AnyObject, ArrayUpdateOptions, DeepItemValue, DeepKeys, DeepValue } from "./types";

import { DEFAULT_CHANGE_CAUSE } from "./constants";
import { clone } from "./utils/clone";
import { collectFieldPaths } from "./utils/collectFieldPaths";
import { get, set } from "./utils/object";

// TOCHECK

type ArrayIdentityMutation =
  | { type: "insert"; index: number }
  | { type: "remove"; index: number }
  | { type: "move"; fromIndex: number; toIndex: number }
  | { type: "swap"; indexA: number; indexB: number };

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
    mutation: ArrayIdentityMutation,
    options: ArrayUpdateOptions,
  ): TItemValue[] | null => {
    const { form, name } = this;
    const oldValues = clone(form._values);
    const arrayId = form.fieldIdRegistry.prepareArray(name, form._values, oldValue.length);

    if (arrayId == null) {
      return null;
    }

    const success = set(form._values as AnyObject, name, newValue);

    if (!success) {
      return null;
    }

    this.updateIdentity(arrayId, mutation);

    const { dontValidate = false, cause = DEFAULT_CHANGE_CAUSE } = options;
    const notifiedFields = this.collectAffectedFields(oldValue, newValue, mutation);

    if (dontValidate) {
      notifiedFields.add(name);
    }

    for (const field of notifiedFields) {
      const value = form.getFieldValue(field);

      form.fieldSubjects.get(field)?.next({
        value,
        meta: form.getFieldMeta(field),
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
    const meta = form._validateSync(validationSpec, {
      shouldBlur: false,
      shouldTouch: true,
      shouldDirty: true,
    });

    form.updateAndNotifyField(name, {
      value: newValue as DeepValue<TFormValues, TField>,
      meta,
    });

    form.valueSubjects.get(name)?.next({
      value: newValue as DeepValue<TFormValues, TField>,
      oldValue: oldValue as DeepValue<TFormValues, TField>,
      form,
      cause,
    });

    form.syncMeta();

    // TODO add an option to validate async even if there are sync errors
    if (meta.errors.change.length === 0) {
      form.scheduleAsyncValidation(form.asyncValidationSpec("change", name));
    }

    return newValue;
  };

  private updateIdentity = (arrayId: FieldId, mutation: ArrayIdentityMutation): void => {
    const { fieldIdRegistry } = this.form;

    switch (mutation.type) {
      case "insert":
        fieldIdRegistry.insert(arrayId, mutation.index);
        return;
      case "remove": {
        const removedItemKey = fieldIdRegistry.remove(arrayId, mutation.index);

        if (removedItemKey != null) {
          this.form.removeFieldIdState(removedItemKey);
        }
        return;
      }
      case "move":
        fieldIdRegistry.move(arrayId, mutation.fromIndex, mutation.toIndex);
        return;
      case "swap":
        fieldIdRegistry.swap(arrayId, mutation.indexA, mutation.indexB);
        return;
      default:
        mutation satisfies never;
        return;
    }
  };

  private collectAffectedFields = (
    oldValue: TItemValue[],
    newValue: TItemValue[],
    mutation: ArrayIdentityMutation,
  ): Set<string> => {
    const indices: number[] = [];

    if (mutation.type === "swap") {
      indices.push(mutation.indexA, mutation.indexB);
    } else {
      const startIndex =
        mutation.type === "move" ? Math.min(mutation.fromIndex, mutation.toIndex) : mutation.index;
      const endIndex =
        mutation.type === "move"
          ? Math.max(mutation.fromIndex, mutation.toIndex)
          : Math.max(oldValue.length, newValue.length) - 1;

      for (let index = startIndex; index <= endIndex; index++) {
        indices.push(index);
      }
    }

    const fields = new Set<string>();

    for (const index of indices) {
      const prefix = `${this.name}.${index}`;

      collectFieldPaths(oldValue[index], prefix, [prefix]).forEach((field) => fields.add(field));
      collectFieldPaths(newValue[index], prefix, [prefix]).forEach((field) => fields.add(field));

      for (const subscribedField of [
        ...this.form.fieldSubjects.keys(),
        ...this.form.valueSubjects.keys(),
      ]) {
        if (subscribedField === prefix || String(subscribedField).startsWith(`${prefix}.`)) {
          fields.add(subscribedField);
        }
      }
    }

    return fields;
  };

  /**
   * @public
   */
  insert = (
    value: TItemValue,
    index?: number,
    options: ArrayUpdateOptions = {},
  ): TItemValue[] | null => {
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

    return this.update(arrayValue, currentValue, { type: "insert", index: insertIndex }, options);
  };

  /**
   * @public
   */
  remove = (index: number, options: ArrayUpdateOptions = {}): TItemValue[] | null => {
    const currentValue = this.resolvedValue;

    if (currentValue == null) {
      return null;
    }

    if (index < 0 || index >= currentValue.length) {
      return null;
    }

    const newValue = [...currentValue.slice(0, index), ...currentValue.slice(index + 1)];

    return this.update(newValue, currentValue, { type: "remove", index }, options);
  };

  /**
   * @public
   */
  move = (
    fromIndex: number,
    toIndex: number,
    options: ArrayUpdateOptions = {},
  ): TItemValue[] | null => {
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

    return this.update(newValue, currentValue, { type: "move", fromIndex, toIndex }, options);
  };

  /**
   * @public
   */
  swap = (
    indexA: number,
    indexB: number,
    options: ArrayUpdateOptions = {},
  ): TItemValue[] | null => {
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

    return this.update(newValue, currentValue, { type: "swap", indexA, indexB }, options);
  };
}
