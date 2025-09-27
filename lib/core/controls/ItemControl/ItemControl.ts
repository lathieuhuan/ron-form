import { ControlOptions, ControlState, ValueChangeOptions } from "@lib/core/types";
import { BaseControl } from "../BaseControl";

export class ItemControl<TValue = unknown> extends BaseControl<TValue | undefined> {
  readonly defaultValue: TValue | undefined;
  private value: TValue | undefined;
  private isTouched = false;

  constructor(defaultValue?: TValue, options: ControlOptions<TValue | undefined> = {}) {
    super(options);
    this.defaultValue = defaultValue;
    this.value = defaultValue;

    const errors = this.validate();
    if (errors) {
      this.syncErrors = errors;
    }
  }

  clone(): this {
    const control = new ItemControl(this.defaultValue);
    control.validator.set(this.validator.validators);
    control.asyncValidator.set(this.asyncValidator.validators);
    return control as this;
  }

  getControl() {
    return this;
  }

  // ↓↓↓ VALUE ↓↓↓

  getValue() {
    return this.value === "" ? undefined : this.value;
  }

  protected _setValue(value: TValue | undefined): void {
    this.value = value === "" ? undefined : value;
  }
  setValue(value: TValue | undefined, options?: ValueChangeOptions): void {
    this._setValue(value);
    this.onValueChange(options);
  }

  // To comply with patchValue on BaseControl
  protected _patchValue(value: TValue | undefined): void {
    this._setValue(value);
  }
  patchValue(value: TValue | undefined, options?: ValueChangeOptions): void {
    this._patchValue(value);
    this.onValueChange(options);
  }

  protected _resetValue(): void {
    this.value = this.defaultValue;
  }
  resetValue(options?: ValueChangeOptions): void {
    this._resetValue();
    this.onValueChange(options);
  }

  // ↑↑↑ VALUE ↑↑↑

  getIsValid() {
    return this.getErrors() === null;
  }

  getIsPending(): boolean {
    return this.isPending;
  }

  getIsTouched(): boolean {
    return this.isTouched;
  }
  setIsTouched(isTouched: boolean): void {
    this.isTouched = isTouched;
  }

  getState(): ControlState {
    const isValid = this.getIsValid();

    return {
      isValid,
      isPending: this.isPending,
      isTouched: this.isTouched,
      isError: !isValid && this.getIsTouched(),
      errors: this.getErrors(),
    };
  }

  resetState(): void {
    this.syncErrors = this.validate();
    this.isTouched = false;
    this.isPending = false;
  }

  reset(): void {
    this._resetValue();
    this.resetState();
    this.abortAsyncValidation();
  }
}
