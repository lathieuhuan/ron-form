import { BaseControl } from "./base_control";
import { ParentControl, ParentControlOptions } from "./parent_control";
import {
  ComposableAsyncValidators,
  ComposableValidators,
  ListPath,
  ControlAtListPath,
  ListItemValue,
} from "./types";
import { createSubject } from "./utils/create_subject";
import { getControl } from "./utils/get_control";
import { toArray } from "./utils/to_array";

export type ListItemControl<TValue, TControl = BaseControl<TValue>> = {
  id: number;
  control: TControl;
};

export class ListControl<
  TChildControl extends BaseControl<any> = BaseControl<any>,
  TItemValue extends ListItemValue<TChildControl> = ListItemValue<TChildControl>,
> extends ParentControl<TItemValue[]> {
  //
  items: ListItemControl<TItemValue>[] = [];
  private nextId = 1;
  private listSubject = createSubject<ListItemControl<TItemValue>[]>();
  private isTouchedList = false;

  constructor(
    private sampleControl: TChildControl,
    validators: ComposableValidators<TItemValue[]> | null = null,
    asyncValidators: ComposableAsyncValidators<TItemValue[]> | null = null,
    options: ParentControlOptions = {},
  ) {
    super(validators, asyncValidators, options);
  }

  clone(): this {
    const control = new ListControl<TChildControl, TItemValue>(this.sampleControl);
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

  getValue(): TItemValue[] {
    return this.items.map((item) => item.control.getValue());
  }

  setValue(value: TItemValue[]): void {
    this.items.forEach((item, index) => item.control.setValue(value[index]));
  }

  // LIST ONLY

  subscribeList(callback: (items: ListItemControl<TItemValue>[]) => void) {
    return this.listSubject.subscribe(callback);
  }

  insertItem(index: number): void {
    const item = this.sampleControl.clone() as TChildControl;
    item.parent = this;
    item.name = this.nextId.toString();

    this.items.splice(index, 0, { id: this.nextId, control: item });
    this.controlSet.add(item);
    this.nextId++;
    this.listSubject.next(this.items);
    this.isTouchedList = true;
    this.notifyObservers();
    item.validateSync({ isBubbling: true });
  }

  removeItem(id: number): void {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const [removedItem] = this.items.splice(index, 1);

    if (removedItem) {
      this.controlSet.delete(removedItem.control);
      this.listSubject.next(this.items);
      this.isTouchedList = true;
      this.notifyObservers();
      this.validateSync({ isBubbling: true });
    }
  }
}
