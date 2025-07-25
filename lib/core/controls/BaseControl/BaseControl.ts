import type {
  ComposableAsyncValidators,
  ComposableValidators,
  ControlOptions,
  ControlState,
  ValidateOptions,
  ValidationErrors,
} from "@lib/core/types";
import { createSubject, type Observer } from "@lib/core/utils/create_subject";
import { mergeErrors } from "@lib/core/utils/merge_errors";
import { createAsyncValidator } from "./createAsyncValidator";
import { createValidator } from "./createValidator";

export abstract class BaseControl<TValue = unknown> {
  name = "root";
  parent: BaseControl<any> = this;
  errors: ValidationErrors | null = null;
  // protected isValid = true;
  protected isPending = false;
  protected validator = createValidator<TValue>();
  protected asyncValidator = createAsyncValidator<TValue>();
  protected valueSubject = createSubject<TValue | undefined>();
  protected stateSubject = createSubject<ControlState>();

  abstract getValue(): TValue;
  abstract setValue(value: TValue | undefined): void;
  abstract patchValue(value: unknown): void;
  abstract getIsValid(): boolean;
  abstract getIsPending(): boolean;
  abstract getIsTouched(): boolean;
  abstract setIsTouched(isTouched: boolean): void;
  abstract getState(): ControlState;
  abstract resetValue(): void;
  abstract resetState(): void;
  abstract reset(): void;
  /** for children controls to bubble isValid */
  // abstract checkIsValid(): void;
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

  /** run synchronous validators and return errors */
  validateSync(options?: ValidateOptions): ValidationErrors | null {
    const errors = this.validator.validate(this);

    if (errors) {
      options?.onError?.(errors);
    }
    return errors;
  }

  async validateAsync(options?: ValidateOptions): Promise<ValidationErrors | null> {
    const errors = await this.asyncValidator.validate(this);

    if (errors) {
      options?.onError?.(errors);
    }
    return errors;
  }

  abortAsyncValidation(): void {
    // TODO
  }

  private async validateBoth({
    onError,
    ...restOptions
  }: ValidateOptions = {}): Promise<ValidationErrors | null> {
    this.errors = this.validateSync(restOptions);
    this.isPending = true;

    const asyncErrors = await this.validateAsync(restOptions);
    this.errors = mergeErrors([this.errors, asyncErrors]);
    this.isPending = false;

    if (this.errors) {
      onError?.(this.errors);
    }

    return this.errors;
  }

  validate(options?: ValidateOptions) {
    if (this.asyncValidator.isActive) {
      this.validateBoth(options);
    } else {
      this.validateSync(options);
    }
  }

  // handleValidateResult(options?: ValidateOptions): void {
  //   if (!options?.isMuted) {
  //     this.notifyStateObservers();
  //   }
  //   if (options?.isBubbling && this.parent !== this) {
  //     this.parent.checkIsValid();
  //   }
  // }

  // ===== OBSERVERS =====

  subscribeValue(subscriber: Observer<TValue | undefined>) {
    return this.valueSubject.subscribe(subscriber);
  }

  subscribeState(subscriber: Observer<ControlState>) {
    return this.stateSubject.subscribe(subscriber);
  }

  notifyValueObservers(): void {
    this.valueSubject.next(() => this.getValue());
  }

  notifyStateObservers(): void {
    this.stateSubject.next(() => this.getState());
  }
}
