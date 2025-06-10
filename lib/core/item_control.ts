import { BaseControl } from "./base_control";
import { ControlOptions, ControlState } from "./types";

export class ItemControl<TValue = unknown> extends BaseControl<TValue> {
  readonly defaultValue: TValue | undefined;
  private value: TValue | undefined;
  private isTouched = false;
  protected override shouldTouchOnValidate = true;

  constructor(defaultValue?: TValue, options: ControlOptions<TValue> = {}) {
    super(options);
    this.defaultValue = defaultValue;
    this.value = defaultValue;

    this.validateSync({
      isBubbling: false,
      shouldTouch: false,
    });
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
    this.value = value === "" ? (null as unknown as TValue) : value;
    this.notifyObservers();

    if (!this.isTouched) {
      this.setIsTouched(true);
      this.notifyStateObservers();
    }
  }

  // To comply with BaseControl.patchValue
  patchValue(value: TValue): void {
    this.setValue(value);
  }

  getIsValid() {
    return this.isValid;
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
    return {
      isValid: this.isValid,
      isPending: this.isPending,
      isTouched: this.isTouched,
      isError: !this.isValid && this.isTouched,
      errors: this.errors,
    };
  }

  resetValue(): void {
    this.value = this.defaultValue;
    this.notifyObservers();
    // TODO: abort async validator
  }

  reset(): void {
    this.resetValue();
    this.resetState();
    // TODO: abort async validator
  }

  override checkIsValid(): void {
    // to comply with BaseControl.checkIsValid
  }

  override resetState(): void {
    super.resetState();
    this.isTouched = false;
  }
}
