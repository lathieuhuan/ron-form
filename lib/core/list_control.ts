import { BaseControl } from "./base_control";
import { ParentControl } from "./parent_control";
import { ControlAtListPath, ListItemValue, ListPath, ParentControlOptions } from "./types";
import { createSubject } from "./utils/create_subject";
import { getControl } from "./utils/get_control";
import { toArray } from "./utils/to_array";

export type ListItemControl<TValue, TControl = BaseControl<TValue>> = {
  id: number;
  control: TControl;
};

export type ListValue<TValue> = (TValue | undefined)[] | undefined;

export class ListControl<
  TChildControl extends BaseControl<any> = BaseControl<any>,
  TItemValue extends ListItemValue<TChildControl> = ListItemValue<TChildControl>,
  TValue extends (TItemValue | undefined)[] = (TItemValue | undefined)[],
> extends ParentControl<TValue | undefined> {
  //
  items: ListItemControl<TItemValue>[] = [];
  private nextId = 1;
  private listSubject = createSubject<ListItemControl<TItemValue>[]>();
  private isTouchedList = false;

  constructor(
    private sampleControl: TChildControl,
    options: ParentControlOptions<TValue | undefined> = {},
  ) {
    super(options);
    this.validateSync({ isBubbling: false });
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

  override getIsTouched(): boolean {
    return this.isTouchedList || super.getIsTouched();
  }

  getValue(): TValue | undefined {
    const value = this.items.map((item) => item.control.getValue());
    return value.length ? (value as TValue) : undefined;
  }

  /** set undefined will clear all items */
  setValue(value: TValue | undefined): void {
    if (value === undefined) {
      this.items = [];
      this.nextId = 1;
      this.listSubject.next(this.items);
      this.notifyValueObservers();
      this.validateSync({ isBubbling: true });
    } else {
      this.items.forEach((item, index) => item.control.setValue(value[index]));
    }
  }

  patchValue(value: TValue): void {
    this.items.forEach((item, index) => item.control.patchValue(value[index]));
  }

  // LIST ONLY

  subscribeList(callback: (items: ListItemControl<TItemValue>[]) => void) {
    return this.listSubject.subscribe(callback);
  }

  insertItem(index: number, value?: TItemValue): TChildControl {
    const item = this.sampleControl.clone() as TChildControl;
    item.parent = this;
    item.name = this.nextId.toString();

    this.items.splice(index, 0, { id: this.nextId, control: item });
    this.controlSet.add(item);
    this.nextId++;
    this.listSubject.next(this.items);
    this.isTouchedList = true;
    this.notifyValueObservers();
    item.validateSync({ isBubbling: true });

    if (value) {
      item.setValue(value);
    }
    return item;
  }

  removeItem(id: number): void {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const [removedItem] = this.items.splice(index, 1);

    if (removedItem) {
      this.controlSet.delete(removedItem.control);
      this.listSubject.next(this.items);
      this.isTouchedList = true;
      this.notifyValueObservers();
      this.validateSync({ isBubbling: true });
    }
  }
}
