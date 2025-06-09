import { BaseControl } from "./base_control";
import { ParentControl, ParentControlOptions } from "./parent_control";
import {
  ComposableAsyncValidators,
  ComposableValidators,
  ListPath,
  ControlAtListPath,
  ListValue,
} from "./types";
import { createSubject } from "./utils/create_subject";
import { getControl } from "./utils/get_control";
import { toArray } from "./utils/to_array";

export type ListItemControl<TControl extends BaseControl<any> = BaseControl<any>> = {
  id: number;
  control: TControl;
};

export class ListControl<
  TChildControl extends BaseControl<any> = BaseControl<any>,
  TValue extends ListValue<TChildControl> = ListValue<TChildControl>,
> extends ParentControl<TValue[]> {
  //
  items: ListItemControl<TChildControl>[] = [];
  private nextId = 1;
  private listSubject = createSubject<ListItemControl<TChildControl>[]>();
  private isTouchedList = false;

  constructor(
    private sampleControl: TChildControl,
    validators: ComposableValidators<TValue[]> | null = null,
    asyncValidators: ComposableAsyncValidators<TValue[]> | null = null,
    options: ParentControlOptions = {},
  ) {
    super(validators, asyncValidators, options);
  }

  clone(): this {
    const control = new ListControl<TChildControl>(this.sampleControl);
    control.validator.set(this.validator.validators as any);
    control.asyncValidator.set(this.asyncValidator.validators as any);
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

  getValue(): TValue[] {
    return this.items.map((item) => item.control.getValue());
  }

  setValue(value: TValue[]): void {
    this.items.forEach((item, index) => item.control.setValue(value[index]));
  }

  // LIST ONLY

  subscribeList(callback: (items: ListItemControl<TChildControl>[]) => void) {
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
