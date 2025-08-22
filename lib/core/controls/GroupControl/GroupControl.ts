import { getControl } from "@lib/core/utils/getControl";
import {
  ControlAtGroupPath,
  DeepPartial,
  GroupPath,
  GroupValue,
  ParentControlOptions,
} from "../../types";
import { BaseControl } from "../BaseControl";
import { ParentControl } from "../ParentControl";

export class GroupControl<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls> = GroupValue<TControls>,
> extends ParentControl<TValue> {
  //
  constructor(public readonly controls: TControls, options: ParentControlOptions<TValue> = {}) {
    super(options);
    this.controls = controls;

    Object.entries(controls).forEach(([name, control]) => {
      control.parent = this;
      control.name = name;
      this.controlSet.add(control);
    });

    const errors = this.validateSync();

    if (errors) {
      this.syncErrors = errors;
    }
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
    return getControl(this as BaseControl<any>, path) as ControlAtGroupPath<TControls, TPath>;
  }

  getValue(): TValue {
    return Object.entries(this.controls).reduce((acc, [key, control]) => {
      return Object.assign(acc, { [key]: control.getValue() });
    }, {}) as TValue;
  }

  setValue(value: DeepPartial<TValue> | undefined): void {
    if (typeof value === "object" && value !== null) {
      for (const [key, control] of Object.entries(this.controls)) {
        control.setValue(value[key]);
      }
    } else {
      this.controlSet.forEach((control) => {
        control.setValue(undefined);
      });
    }
  }

  patchValue(value: DeepPartial<TValue>): void {
    if (typeof value === "object" && value !== null) {
      for (const [key, _value] of Object.entries(value)) {
        this.controls[key]?.patchValue(_value);
      }
    }
  }

  // ===== DELEGATE to child controls =====

  override getFieldValue<TPath extends GroupPath<TControls>>(
    path: TPath,
  ): ReturnType<ControlAtGroupPath<TControls, TPath>["getValue"]> {
    return this.getControl(path)?.getValue();
  }

  override setFieldValue<TPath extends GroupPath<TControls>>(
    path: TPath,
    value: ReturnType<ControlAtGroupPath<TControls, TPath>["getValue"]>,
  ): void {
    this.getControl(path)?.setValue(value);
  }

  override resetFieldValue<TPath extends GroupPath<TControls>>(path: TPath): void {
    this.getControl(path)?.resetValue();
  }

  override resetField<TPath extends GroupPath<TControls>>(path: TPath): void {
    this.getControl(path)?.reset();
  }
}
