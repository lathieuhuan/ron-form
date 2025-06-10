import type {
  ComposableAsyncValidators,
  ComposableValidators,
  ControlOptions,
  ControlState,
  NotifyStateOptions,
  ValidateOptions,
  ValidationErrors,
} from "../types";
import { createSubject, type Observer } from "../utils/create_subject";
import { mergeErrors } from "../utils/merge_errors";
import { createAsyncValidator } from "./create_async_validator";
import { createValidator } from "./create_validator";

export abstract class BaseControl<TValue = unknown> {
  name = "root";
  parent: BaseControl<any> = this;
  errors: ValidationErrors | null = null;
  protected isValid = true;
  protected isPending = false;
  protected validator = createValidator<TValue>();
  protected asyncValidator = createAsyncValidator<TValue>();
  protected valueSubject = createSubject<TValue | undefined>();
  protected stateSubject = createSubject<ControlState>();
  protected shouldTouchOnValidate = false;

  abstract getValue(): TValue;
  abstract setValue(value: TValue | undefined): void;
  abstract patchValue(value: unknown): void;
  abstract getIsValid(): boolean;
  abstract getIsPending(): boolean;
  abstract getIsTouched(): boolean;
  abstract setIsTouched(isTouched: boolean): void;
  abstract getState(): ControlState;
  abstract resetValue(): void;
  abstract reset(): void;
  /** for children controls to bubble isValid */
  abstract checkIsValid(): void;
  /**
   * Only copy the following:
   * - item: default value
   * - list: sampleControl
   * - group: controls
   * - current validators and async validators
   */
  abstract clone(): this;

  constructor(options: ControlOptions<TValue> = {}) {
    if (options.validators) {
      this.validator.add(options.validators);
    }
    if (options.asyncValidators) {
      this.asyncValidator.add(options.asyncValidators);
    }
  }

  protected resetState(): void {
    this.isPending = false;
    this.validateSync({ shouldTouch: false });
  }

  addValidator(validators: ComposableValidators<TValue>): void {
    this.validator.add(validators);
  }

  removeValidator(validators: ComposableValidators<TValue>): void {
    this.validator.remove(validators);
  }

  validateSync(options?: ValidateOptions): ValidationErrors | null {
    const { shouldTouch = true } = options ?? {};

    this.errors = this.validator.validate(this);
    this.isValid = this.errors === null;

    if (this.shouldTouchOnValidate && shouldTouch) {
      this.setIsTouched(true);
    }

    this.handleValidateResult(options);

    if (this.errors) {
      options?.onError?.(this.errors);
    }
    return this.errors;
  }

  addAsyncValidator(validators: ComposableAsyncValidators<TValue>): void {
    this.asyncValidator.add(validators);
  }

  removeAsyncValidator(validators: ComposableAsyncValidators<TValue>): void {
    this.asyncValidator.remove(validators);
  }

  /** Should use it only when you know async validation is enabled for better performance */
  async validateAsync(options?: ValidateOptions): Promise<null> {
    this.errors = this.validator.validate(this) ?? null;
    this.isValid = this.errors === null;
    this.isPending = true;
    this.handleValidateResult(options);

    const errors = await this.asyncValidator.validate(this);

    this.errors = mergeErrors([this.errors, errors]);
    this.isValid = this.errors === null;
    this.isPending = false;
    this.handleValidateResult(options);

    if (this.errors) {
      options?.onError?.(this.errors);
      throw this.errors;
    }
    return null;
  }

  validate(options?: ValidateOptions) {
    if (this.asyncValidator.isActive) {
      this.validateAsync(options).catch(() => {});
    } else {
      this.validateSync(options);
    }
  }

  handleValidateResult(options?: ValidateOptions): void {
    if (!options?.isMuted) {
      this.notifyStateObservers();
    }
    if (options?.isBubbling && this.parent !== this) {
      this.parent.checkIsValid?.();
    }
  }

  subscribe(subscriber: Observer<TValue | undefined>) {
    return this.valueSubject.subscribe(subscriber);
  }

  subscribeState(subscriber: Observer<ControlState>) {
    return this.stateSubject.subscribe(subscriber);
  }

  notifyObservers(): void {
    this.valueSubject.next(() => this.getValue());

    if (this.parent !== this) {
      this.parent.notifyObservers();
    }
  }

  notifyStateObservers(options?: NotifyStateOptions): void {
    this.stateSubject.next(() => this.getState());

    const isBubbling = options?.isBubbling ?? true;

    if (isBubbling && this.parent !== this) {
      this.parent.notifyStateObservers(options);
    }
  }
}
