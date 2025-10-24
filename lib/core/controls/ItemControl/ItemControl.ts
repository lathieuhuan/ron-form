import { ControlOptions, ControlState, ValueChangeOptions } from "@lib/core/types";
import { BaseControl } from "../BaseControl";
import { Transaction } from "../Transaction";

export class ItemControl<TValue = unknown> extends BaseControl<TValue | undefined> {
  readonly defaultValue: TValue | undefined;
  private value: TValue | undefined;
  private isTouched = false;

  constructor(defaultValue?: TValue, options: ControlOptions<TValue | undefined> = {}) {
    super(options);
    this.defaultValue = defaultValue;
    this.value = defaultValue;
    this.syncErrors = this.validator.validate();
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
    return this.value;
  }

  setValue(value: TValue | undefined, options?: ValueChangeOptions): void {
    this.value = value;
    this.onValueChange(options);
  }

  // To comply with patchValue on BaseControl
  patchValue(value: TValue | undefined, options?: ValueChangeOptions): void {
    this.setValue(value, options);
  }

  resetValue(options?: ValueChangeOptions): void {
    this.value = this.defaultValue;
    this.onValueChange(options);
  }

  onTransaction(transaction: Transaction<ItemControl<TValue>>): void {}

  handleValueChangeByUser(value: TValue) {
    const transaction = new Transaction<ItemControl<TValue>>(this);

    transaction.setValue(value);

    transaction.continue = () => {
      this.value = transaction.value;
      this.syncErrors = this.validator.validate();

      if (!this.isTouched) {
        this.isTouched = true;
      }

      this.notifyValueObservers();
      this.notifyStateObservers();
      this["notifyParentOfValue"]({ validate: true });
    };

    this.onTransaction(transaction);

    if (!transaction.paused) {
      transaction.continue();
    }
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

  reset(): void {
    this.value = this.defaultValue;
    this.syncErrors = this.validator.validate();
    this.isTouched = false;
    this.isPending = false;
    this.onValueChange({ validate: false });
    this.abortAsyncValidation();
  }
}
