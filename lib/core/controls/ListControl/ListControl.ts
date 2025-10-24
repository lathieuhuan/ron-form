import type {
  ControlAtListPath,
  ListItemValue,
  ListPath,
  ParentControlOptions,
  ValueChangeOptions,
} from "@lib/core/types";
import type { ItemControl } from "../ItemControl";
import type { GroupControl } from "../GroupControl";

import { createSubject } from "@lib/core/utils/createSubject";
import { getControl } from "@lib/core/utils/getControl";
import { toArray } from "@lib/core/utils/toArray";
import { BaseControl } from "../BaseControl";
import { ParentControl } from "../ParentControl";

type ListControlOptions<TValue> = ParentControlOptions<TValue | undefined> & {
  /** initialValues[i] undefined will not override the item's initial value. */
  initialValues?: TValue;
};

export class ListControl<
  TChildControl extends BaseControl<any> = BaseControl<any>,
  TItemValue extends ListItemValue<TChildControl> = ListItemValue<TChildControl>,
  TValue extends (TItemValue | undefined)[] = (TItemValue | undefined)[],
> extends ParentControl<TValue | undefined> {
  //
  private sampleControl: TChildControl;
  private nextId = 1;
  private listSubject = createSubject<TChildControl[]>();
  private isTouched = false;

  constructor(sampleControl: TChildControl, options: ListControlOptions<TValue> = {}) {
    super(options);
    this.sampleControl = sampleControl.clone();

    options.initialValues?.forEach((value) => {
      this._insertItem(value);
    });

    this.syncErrors = this.validator.validate();
  }

  clone(): this {
    const control = new ListControl<TChildControl, TItemValue, TValue>(this.sampleControl);
    control.validator.set(this.validator.validators);
    control.asyncValidator.set(this.asyncValidator.validators);
    return control as unknown as this;
  }

  getControl<TPath extends ListPath<TChildControl>>(
    path: TPath,
  ): ControlAtListPath<TChildControl, TPath> {
    return getControl(this as BaseControl<unknown>, toArray(path)) as ControlAtListPath<
      TChildControl,
      TPath
    >;
  }

  getControls() {
    return this.controlList as TChildControl[];
  }

  override getIsTouched(): boolean {
    return this.isTouched || super.getIsTouched();
  }

  override setIsTouched(isTouched: boolean): void {
    this.isTouched = isTouched;
    super.setIsTouched(isTouched);
  }

  // ↓↓↓ VALUE ↓↓↓

  getValue(): TValue | undefined {
    const value = this.controlList.map((control) => control.getValue());
    return value.length
      ? (value as TValue)
      : this.isTouched
      ? ([] as unknown as TValue)
      : undefined;
  }

  /**
   * - values undefined will set value of every item to undefined.
   * - value[i] undefined will set value of item[i] to undefined.
   * - item[n] with n >= values.length will be set value to undefined.
   */
  setValue(values: (TItemValue | undefined)[] | undefined, options?: ValueChangeOptions): void {
    this.controlList.forEach((control, index) => control.setValue(values?.[index], options));
    this.onValueChange(options);
  }

  /**
   * - if values[i] is undefined, item[i] will keep its value.
   * - item[n] with n >= values.length will keep its value.
   */
  patchValue(values: (TItemValue | undefined)[], options?: ValueChangeOptions): void {
    values.forEach((value, index) => {
      if (value) {
        this.controlList[index]?.patchValue(value, options);
      }
    });

    this.onValueChange(options);
  }

  // ↑↑↑ VALUE ↑↑↑

  // LIST ONLY

  subscribeList(callback: (controls: TChildControl[]) => void) {
    return this.listSubject.subscribe(callback);
  }

  private createItemControl(value?: TItemValue): TChildControl {
    const item = this.sampleControl.clone() as TChildControl;
    item.parent = this;
    item.name = this.nextId.toString();

    if (value !== undefined) {
      item.setValue(value);
    }

    return item;
  }

  private _insertItem(value?: TItemValue, index?: number): TChildControl | undefined {
    if (index !== undefined && (index < 0 || index > this.controlList.length)) {
      return undefined;
    }

    const itemControl = this.createItemControl(value);

    if (index === undefined) {
      this.controlList.push(itemControl);
    } else {
      this.controlList.splice(index, 0, itemControl);
    }

    this.nextId++;
    this.listSubject.next(this.controlList as TChildControl[]);

    return itemControl;
  }

  /**
   * - If value is provided (not undefined), it will override the item's initial value.
   * - If index is undefined, it will be inserted at the end of the list.
   * - If index < 0 || index > items.length, this operation will fail and return undefined.
   */
  insertItem(value?: TItemValue, index?: number): TChildControl | undefined {
    const control = this._insertItem(value, index);

    if (control) {
      control.setErrors(control["validator"].validate());

      this.isTouched = true;
      this.notifyValueObservers();
      this.notifyStateObservers();
    }

    return control;
  }

  /**
   * - If index is undefined, new items will be inserted at the end of the list.
   * - If index < 0 || index > items.length, this operation will fail and return undefined.
   * @returns new items.
   */
  insertItems(countOrValues: number | TItemValue[], index?: number): TChildControl[] | undefined {
    if (index !== undefined && (index < 0 || index > this.controlList.length)) {
      return undefined;
    }

    const newControls: TChildControl[] = [];
    const count = typeof countOrValues === "number" ? countOrValues : countOrValues.length;
    const values = typeof countOrValues === "number" ? undefined : countOrValues;

    for (let i = 0; i < count; i++) {
      const control = this.createItemControl(values?.[i]);

      newControls.push(control);
      this.nextId++;
    }

    if (index === undefined) {
      this.controlList.push(...newControls);
    } else {
      this.controlList.splice(index, 0, ...newControls);
    }

    this.listSubject.next(this.controlList as TChildControl[]);

    this.isTouched = true;
    this.notifyValueObservers();
    this.notifyStateObservers();

    return newControls;
  }

  removeItem(nameOrControl: string | TChildControl): TChildControl | undefined {
    const name = typeof nameOrControl === "string" ? nameOrControl : nameOrControl.name;
    const index = this.controlList.findIndex((control) => control.name === name);

    if (index === -1) {
      return undefined;
    }

    const [removedControl] = this.controlList.splice(index, 1);

    if (removedControl) {
      this.listSubject.next(this.controlList as TChildControl[]);

      this.isTouched = true;
      this.notifyValueObservers();
      this.validate();

      return removedControl as TChildControl;
    }

    return undefined;
  }

  removeItems(shouldRemove: (control: TChildControl) => boolean): TChildControl[] {
    const removedControls: TChildControl[] = [];

    this.controlList = this.controlList.filter((control) => {
      const removed = shouldRemove(control as TChildControl);

      if (removed) {
        removedControls.push(control as TChildControl);
      }
      return !removed;
    });

    return removedControls;
  }

  clearItems(): void {
    this.controlList = [];
    this.nextId = 1;
    this.listSubject.next(this.controlList as TChildControl[]);

    this.isTouched = true;
    this.notifyValueObservers();
    this.notifyStateObservers();
  }

  // ===== DELEGATE to child controls =====

  override getFieldValue<
    TPath extends ListPath<TChildControl>,
    TControl = ControlAtListPath<TChildControl, TPath>,
  >(
    path: TPath,
  ): TControl extends BaseControl<infer TBaseValue>
    ? TBaseValue
    : TControl extends ItemControl<infer TItemValue>
    ? TItemValue
    : TControl extends GroupControl<infer _, infer TGroupValue>
    ? TGroupValue
    : TControl extends ListControl<infer _, infer __, infer TListValue>
    ? TListValue
    : TControl extends undefined
    ? undefined
    : never {
    return this.getControl(path)?.getValue();
  }

  // override setFieldValue<TPath extends GroupPath<TControls>>(
  //   path: TPath,
  //   value: ReturnType<ControlAtGroupPath<TControls, TPath>["getValue"]>,
  // ): void {
  //   this.getControl(path)?.setValue(value);
  // }

  // override resetFieldValue<TPath extends GroupPath<TControls>>(path: TPath): void {
  //   this.getControl(path)?.resetValue();
  // }

  // override resetField<TPath extends GroupPath<TControls>>(path: TPath): void {
  //   this.getControl(path)?.reset();
  // }
}
