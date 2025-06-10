import { BaseControl } from "./base_control";
import { ParentControl } from "./parent_control";
import {
  ComposableAsyncValidators,
  ComposableValidators,
  ControlAtGroupPath,
  DeepPartial,
  GroupPath,
  GroupValue,
  ParentControlOptions,
} from "./types";
import { getControl } from "./utils/get_control";
import { toArray } from "./utils/to_array";

export class GroupControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
> extends ParentControl<TValue> {
  //
  constructor(private readonly controls: TControls, options: ParentControlOptions<TValue> = {}) {
    super(options);

    Object.entries(controls).forEach(([name, control]) => {
      control.parent = this;
      control.name = name;
      this.controlSet.add(control);
    });
  }

  clone(): this {
    const controls = {} as TControls;

    for (const [key, control] of Object.entries(this.controls)) {
      controls[key as keyof TControls] = control.clone() as TControls[keyof TControls];
    }
    const control = new GroupControl<TControls, TValue>(controls);
    control.validator.set(this.validator.validators);
    control.asyncValidator.set(this.asyncValidator.validators);
    return control as this;
  }

  getControl<TPath extends GroupPath<TControls>>(
    path: TPath,
  ): ControlAtGroupPath<TControls, TPath> {
    return getControl(this as BaseControl<unknown>, toArray(path)) as ControlAtGroupPath<
      TControls,
      TPath
    >;
  }

  getValue(): TValue {
    return Object.entries(this.controls).reduce((acc, [key, control]) => {
      return Object.assign(acc, { [key]: control.getValue() });
    }, {}) as TValue;
  }

  setValue(value: TValue): void {
    if (typeof value === "object" && value !== null) {
      for (const [key, _value] of Object.entries(value)) {
        this.controls[key]?.setValue(_value);
      }
    }
  }

  patchValue(value: DeepPartial<TValue>): void {
    if (typeof value === "object" && value !== null) {
      for (const [key, _value] of Object.entries(value)) {
        this.controls[key]?.patchValue(_value);
      }
    }
  }
}
