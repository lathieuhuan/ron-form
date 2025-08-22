import { ControlOptions, ControlState } from "@lib/core/types";
import { BaseControl } from "../BaseControl";
import { ParentControl } from "../ParentControl";

export class ItemControl<TValue = unknown> extends BaseControl<TValue | undefined> {
  readonly defaultValue: TValue | undefined;
  private value: TValue | undefined;
  private isTouched = false;

  constructor(defaultValue?: TValue, options: ControlOptions<TValue | undefined> = {}) {
    super(options);
    this.defaultValue = defaultValue;
    this.value = defaultValue;

    const errors = this.validateSync();
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

  getValue() {
    return this.value === "" ? undefined : this.value;
  }
  setValue(value: TValue): void {
    this.value = value === "" ? undefined : value;
  }
  // To comply with BaseControl.patchValue
  patchValue(value: TValue): void {
    this.setValue(value);
  }

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

  resetValue(): void {
    this.value = this.defaultValue;
  }

  resetState(): void {
    this.syncErrors = this.validateSync();
    this.isTouched = false;
    this.isPending = false;
  }

  reset(): void {
    this.resetValue();
    this.resetState();
    this.abortAsyncValidation();
  }

  /** Validate and notify */
  // validate(): void {
  //   this.validateSync();
  //   this.notifyValueObservers();
  //   this.notifyStateObservers();

  //   // TODO: validateAsync

  //   if (this.parent instanceof ParentControl) {
  //     this.parent.signalChange();
  //   }
  // }
}
