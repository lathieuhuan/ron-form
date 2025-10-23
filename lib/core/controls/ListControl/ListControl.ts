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

export type ListControlItem<TValue, TControl = BaseControl<TValue>> = {
  id: number;
  control: TControl;
};

type ListControlOptions<TValue> = ParentControlOptions<TValue | undefined> & {
  /** initialValues[i] undefined will not override the item's initial value. */
  initialValues?: TValue;
};

export class ListControl<
  TChildControl extends BaseControl<any> = BaseControl<any>,
  TItemValue extends ListItemValue<TChildControl> = ListItemValue<TChildControl>,
  TValue extends (TItemValue | undefined)[] = (TItemValue | undefined)[],
  TListItem extends ListControlItem<TItemValue, TChildControl> = ListControlItem<
    TItemValue,
    TChildControl
  >,
> extends ParentControl<TValue | undefined> {
  //
  private items: TListItem[] = [];
  private sampleControl: TChildControl;
  private nextId = 1;
  private listSubject = createSubject<TListItem[]>();
  private isTouched = false;

  constructor(sampleControl: TChildControl, options: ListControlOptions<TValue> = {}) {
    super(options);
    this.sampleControl = sampleControl.clone();

    options.initialValues?.forEach((value, index) => {
      this._insertItem(value, index);
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

  getItems(): TListItem[] {
    return this.items;
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
    const value = this.items.map((item) => item.control.getValue());
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
    this.items.forEach((item, index) => item.control.setValue(values?.[index]));
    this.onValueChange(options);
  }

  /**
   * - if values[i] is undefined, item[i] will keep its value.
   * - item[n] with n >= values.length will keep its value.
   */
  patchValue(values: (TItemValue | undefined)[], options?: ValueChangeOptions): void {
    values.forEach((value, index) => {
      if (value) {
        this.items[index]?.control.patchValue(value);
      }
    });

    this.onValueChange(options);
  }

  // ↑↑↑ VALUE ↑↑↑

  // LIST ONLY

  subscribeList(callback: (items: TListItem[]) => void) {
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

  private _insertItem(value?: TItemValue, index?: number): TListItem | undefined {
    if (index !== undefined && (index < 0 || index > this.items.length)) {
      return undefined;
    }

    const itemControl = this.createItemControl(value);
    const item = { id: this.nextId, control: itemControl } as TListItem;

    if (index === undefined) {
      this.items.push(item);
    } else {
      this.items.splice(index, 0, item);
    }

    this.controlSet.add(itemControl);
    this.nextId++;
    this.listSubject.next(this.items);

    return item;
  }

  /**
   * - If value is provided (not undefined), it will override the item's initial value.
   * - If index is undefined, it will be inserted at the end of the list.
   * - If index < 0 || index > items.length, this operation will fail and return undefined.
   */
  insertItem(value?: TItemValue, index?: number): TListItem | undefined {
    const item = this._insertItem(value, index);
    item?.control.setErrors(item?.control["validator"].validate());

    this.isTouched = true;
    this.notifyValueObservers();
    this.notifyStateObservers();

    return item;
  }

  /**
   * - If index is undefined, new items will be inserted at the end of the list.
   * - If index < 0 || index > items.length, this operation will fail and return undefined.
   * @returns new items.
   */
  insertItems(countOrValues: number | TItemValue[], index?: number): TListItem[] | undefined {
    if (index !== undefined && (index < 0 || index > this.items.length)) {
      return undefined;
    }

    const newItems: TListItem[] = [];
    const count = typeof countOrValues === "number" ? countOrValues : countOrValues.length;
    const values = typeof countOrValues === "number" ? undefined : countOrValues;

    for (let i = 0; i < count; i++) {
      const item = this.createItemControl(values?.[i]);

      newItems.push({ id: this.nextId, control: item } as TListItem);
      this.controlSet.add(item);
      this.nextId++;
    }

    if (index === undefined) {
      this.items.push(...newItems);
    } else {
      this.items.splice(index, 0, ...newItems);
    }

    this.listSubject.next(this.items);

    this.isTouched = true;
    this.notifyValueObservers();
    this.notifyStateObservers();

    return newItems;
  }

  removeItem(id: number): TListItem | undefined {
    const index = this.items.findIndex((item) => item.id === id);

    if (index === -1) {
      return undefined;
    }

    const [removedItem] = this.items.splice(index, 1);

    if (removedItem) {
      this.controlSet.delete(removedItem.control);
      this.listSubject.next(this.items);

      this.isTouched = true;
      this.notifyValueObservers();
      this.validate();

      return removedItem;
    }

    return undefined;
  }

  removeItems(shouldRemove: (item: TListItem) => boolean): TListItem[] {
    const removedItems: TListItem[] = [];

    this.items = this.items.filter((item) => {
      const removed = shouldRemove(item);

      if (removed) {
        removedItems.push(item);
      }
      return !removed;
    });

    return removedItems;
  }

  clearItems(): void {
    this.items = [];
    this.nextId = 1;
    this.listSubject.next(this.items);
    // this.notifyValueObservers();
    // this.validate();
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
