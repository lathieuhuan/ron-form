import type {
  ComposableAsyncValidators,
  ComposableValidators,
  ControlOptions,
  ControlState,
  ValidateOptions,
  ValidationErrors,
  ValueChangeOptions,
} from "@lib/core/types";
import { createSubject, type Observer } from "@lib/core/utils/createSubject";
import { mergeErrors } from "@lib/core/utils/mergeErrors";
import { createAsyncValidator } from "./createAsyncValidator";
import { createValidator } from "./createValidator";

export abstract class BaseControl<TValue = unknown> {
  // private id?: string;
  name = "root";
  parent: BaseControl<any> = this;
  /** If true, will listen to child controls' changes. */
  protected isAttentive = true;
  protected isPending = false;
  protected validator = createValidator<TValue>();
  protected asyncValidator = createAsyncValidator<TValue>();
  protected valueSubject = createSubject<TValue | undefined>();
  protected stateSubject = createSubject<ControlState>();
  protected syncErrors: ValidationErrors | null = null;
  protected asyncErrors: ValidationErrors | null = null;

  // Cause typescript error circular constraint
  // abstract getControl(name: NamePath): BaseControl<any> | undefined;

  abstract getValue(): TValue;
  abstract setValue(value: TValue | undefined, options?: ValueChangeOptions): void;
  abstract patchValue(value: unknown, options?: ValueChangeOptions): void;
  abstract resetValue(options?: ValueChangeOptions): void;
  protected abstract _setValue(value: TValue | undefined): void;
  protected abstract _patchValue(value: unknown): void;
  protected abstract _resetValue(): void;

  abstract getIsValid(): boolean;

  abstract getIsPending(): boolean;

  abstract getIsTouched(): boolean;
  abstract setIsTouched(isTouched: boolean): void;

  abstract getState(): ControlState;

  abstract reset(): void;
  /**
   * Only copy the following:
   * - item: default value
   * - group: initial controls
   * - list: sampleControl
   * - current validators and async validators
   */
  abstract clone(): this;

  constructor(options: ControlOptions<TValue> = {}) {
    // this.id = options.id;

    if (options.validators) {
      this.validator.add(options.validators);
    }
    if (options.asyncValidators) {
      this.asyncValidator.add(options.asyncValidators);
    }
  }

  //

  private notifyParentOfValue(options?: Pick<ValueChangeOptions, "validate">) {
    if (this.parent !== this && this.parent.isAttentive) {
      this.parent.onValueChange(options);
    }
  }

  protected onValueChange(options?: ValueChangeOptions): void {
    // console.log("onValueChange", this.id);

    if (options?.validate) {
      this.syncErrors = this.validator.validate(this);

      if (!this.getIsTouched()) {
        this.setIsTouched(true);
      }

      if (this.asyncValidator.isActive) {
        this.isPending = true;
        this.asyncValidator
          .validate(this)
          .then((errors) => {
            this.asyncErrors = errors;
          })
          .finally(() => {
            this.isPending = false;
            this.onStateChange(options);
          });
      }

      if (!options?.muted) {
        this.notifyStateObservers();
      }
    }

    if (!options?.muted) {
      this.notifyValueObservers();
      this.notifyParentOfValue(options);
    }
  }

  private notifyParentOfState() {
    if (this.parent !== this && this.parent.isAttentive) {
      this.parent.onStateChange();
    }
  }

  protected onStateChange(options?: { muted?: boolean }): void {
    if (!options?.muted) {
      // console.log("onStateChange", this.id);
      this.notifyStateObservers();
      this.notifyParentOfState();
    }
  }

  // ===== ERRORS =====

  getIsError(): boolean {
    return !this.getIsValid() && this.getIsTouched();
  }

  getErrors(): ValidationErrors | null {
    return mergeErrors([this.syncErrors, this.asyncErrors]);
  }
  setErrors(errors: ValidationErrors | null, replace = false): void {
    this.syncErrors = replace ? errors : mergeErrors([this.syncErrors, errors]);
  }

  // ===== VALIDATION =====

  addValidator(validators: ComposableValidators<TValue>): void {
    this.validator.add(validators);
  }

  removeValidator(validators: ComposableValidators<TValue>): void {
    this.validator.remove(validators);
  }

  addAsyncValidator(validators: ComposableAsyncValidators<TValue>): void {
    this.asyncValidator.add(validators);
  }

  removeAsyncValidator(validators: ComposableAsyncValidators<TValue>): void {
    this.asyncValidator.remove(validators);
  }

  /** run synchronous validators and return errors, set isTouched to true */
  validate(options?: ValidateOptions): ValidationErrors | null {
    // console.log("validate", this.id);
    const errors = this.validator.validate(this);
    this.syncErrors = errors;

    if (errors) {
      options?.onError?.(errors);
    }

    if (!this.getIsTouched()) {
      this.setIsTouched(true);
    }

    this.onStateChange(options);

    return errors;
  }

  /** run asynchronous validators and return errors */
  async validateAsync(options?: ValidateOptions): Promise<ValidationErrors | null> {
    this.isPending = true;
    const errors = await this.asyncValidator.validate(this);

    this.asyncErrors = errors;
    this.isPending = false;

    if (errors) {
      options?.onError?.(errors);
    }
    return errors;
  }

  abortAsyncValidation(): void {
    // TODO
  }

  // ===== OBSERVERS =====

  subscribeValue(subscriber: Observer<TValue | undefined>) {
    return this.valueSubject.subscribe(subscriber);
  }

  subscribeState(subscriber: Observer<ControlState>) {
    return this.stateSubject.subscribe(subscriber);
  }

  protected notifyValueObservers(): void {
    // console.log("notifyValueObservers", this.id);
    this.valueSubject.next(() => this.getValue());
  }

  protected notifyStateObservers(): void {
    // console.log("notifyStateObservers", this.id);
    this.stateSubject.next(() => this.getState());
  }
}
