import { BaseControl } from "./base_control";
import { ParentControl, ParentControlOptions } from "./parent_control";
import {
  ComposableAsyncValidators,
  ComposableValidators,
  ControlAtGroupPath,
  GroupPath,
  GroupValue,
} from "./types";
import { getControl } from "./utils/get_control";
import { toArray } from "./utils/to_array";

export class GroupControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
> extends ParentControl<TValue> {
  //
  constructor(
    public readonly controls: TControls,
    validators: ComposableValidators<TValue> | null = null,
    asyncValidators: ComposableAsyncValidators<TValue> | null = null,
    options: ParentControlOptions = {},
  ) {
    super(validators, asyncValidators, options);

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
    const value: Record<string, any> = {};

    for (const [key, control] of Object.entries(this.controls)) {
      value[key] = control.getValue();
    }
    return value as TValue;
  }

  setValue(value: TValue): void {
    if (typeof value === "object" && value !== null) {
      for (const [key, _value] of Object.entries(value)) {
        this.controls[key]?.setValue(_value);
      }
    }
  }
}
