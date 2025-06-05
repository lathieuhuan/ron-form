import { BaseControl } from "./base_control";
import { ComposableAsyncValidators, ComposableValidators, ControlState } from "./types";

export class ItemControl<TValue = unknown> extends BaseControl<TValue> {
  readonly defaultValue: TValue;
  private value!: TValue;
  private isTouched = false;
  protected override shouldTouchOnValidate = true;

  constructor(
    defaultValue: TValue,
    validators: ComposableValidators<TValue> | null = null,
    asyncValidators: ComposableAsyncValidators<TValue> | null = null,
  ) {
    super(validators, asyncValidators);
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

  getValue(): TValue {
    return this.value || (null as unknown as TValue);
  }

  setValue(value: TValue): void {
    this.value = value === "" ? (null as unknown as TValue) : value;
    this.notifyObservers();

    if (!this.isTouched) {
      this.setIsTouched(true);
      this.notifyStateObservers();
    }
  }

  // patchValue(value: Partial<TValue>): void {
  //   this.value = { ...this.value, ...value };
  //   this.notifyObservers();
  // }

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
