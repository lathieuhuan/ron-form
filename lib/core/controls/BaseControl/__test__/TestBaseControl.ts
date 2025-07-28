import { ControlState } from "@lib/core/types";
import { BaseControl } from "../BaseControl";

export class TestBaseControl<TValue = unknown> extends BaseControl<TValue> {
  value = null as unknown as TValue;

  get _validator() {
    return this.validator;
  }

  get _asyncValidator() {
    return this.asyncValidator;
  }

  clone(): this {
    return new TestBaseControl<TValue>() as this;
  }
  getControl(): BaseControl<any> | undefined {
    return undefined;
  }
  getValue(): TValue {
    return this.value;
  }
  setValue(value: TValue): void {
    this.value = value;
  }
  patchValue(value: TValue): void {
    this.value = value;
  }
  getIsValid(): boolean {
    return true;
  }
  getIsPending(): boolean {
    return this.isPending;
  }
  getIsTouched(): boolean {
    return false;
  }
  setIsTouched(): void {}
  getState(): ControlState {
    return {
      isTouched: this.getIsTouched(),
      isValid: this.getIsValid(),
      isPending: this.getIsPending(),
      isError: false,
      errors: null,
    };
  }
  resetValue(): void {}
  resetState(): void {}
  reset(): void {}
}
