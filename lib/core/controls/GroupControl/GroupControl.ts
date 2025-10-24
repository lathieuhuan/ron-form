import {
  ControlAtGroupPath,
  DeepPartial,
  GroupPath,
  GroupValue,
  ParentControlOptions,
  ValidateOptions,
  ValidationErrors,
  ValueChangeOptions,
} from "@lib/core/types";
import { getControl } from "@lib/core/utils/getControl";
import { isObject } from "@lib/core/utils/isObject";
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
      this.controlList.push(control);
    });

    this.syncErrors = this.validator.validate();
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

  // ↓↓↓ VALUE ↓↓↓

  getValue(): TValue {
    return Object.entries(this.controls).reduce((acc, [key, control]) => {
      return Object.assign(acc, { [key]: control.getValue() });
    }, {}) as TValue;
  }

  setValue(value: DeepPartial<TValue> | undefined, options?: ValueChangeOptions): void {
    this.actSilently(() => {
      if (isObject(value)) {
        for (const [key, control] of Object.entries(this.controls)) {
          control.setValue(value[key], options);
        }
      } else {
        this.controlList.forEach((control) => {
          control.setValue(undefined, options);
        });
      }
    });

    this.onValueChange(options);
  }

  patchValue(value: DeepPartial<TValue>, options?: ValueChangeOptions): void {
    if (isObject(value)) {
      for (const [key, _value] of Object.entries(value)) {
        this.controls[key]?.patchValue(_value, options);
      }

      this.onValueChange(options);
    }
  }

  // ↑↑↑ VALUE ↑↑↑

  // ===== DELEGATE to child controls =====

  override getFieldValue<TPath extends GroupPath<TControls>>(
    path: TPath,
  ): ReturnType<ControlAtGroupPath<TControls, TPath>["getValue"]> {
    return this.getControl(path)?.getValue();
  }

  override setFieldValue<TPath extends GroupPath<TControls>>(
    path: TPath,
    value: ReturnType<ControlAtGroupPath<TControls, TPath>["getValue"]>,
    options?: ValueChangeOptions,
  ): void {
    const control: BaseControl<any> | undefined = this.getControl(path);

    control?.setValue(value, options);
  }

  override validateField<TPath extends GroupPath<TControls>>(
    path: TPath,
    options?: ValidateOptions,
  ): ValidationErrors | null {
    return this.getControl(path)?.validate(options);
  }

  override resetFieldValue<TPath extends GroupPath<TControls>>(
    path: TPath,
    options?: ValueChangeOptions,
  ): void {
    const control: BaseControl<any> | undefined = this.getControl(path);

    control?.resetValue(options);
  }

  override resetField<TPath extends GroupPath<TControls>>(path: TPath): void {
    this.getControl(path)?.reset();
  }
}
