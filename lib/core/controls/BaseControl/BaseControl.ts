import type {
  ComposableAsyncValidators,
  ComposableValidators,
  ControlOptions,
  ControlState,
  NamePath,
  ValidateOptions,
  ValidationErrors,
  ValueChangeOptions,
} from "@lib/core/types";
import { createSubject, type Observer } from "@lib/core/utils/createSubject";
import { mergeErrors } from "@lib/core/utils/mergeErrors";
import { ProtectedControl } from "./ProtectedControl";
import { createAsyncValidator } from "./createAsyncValidator";
import { createValidator } from "./createValidator";

export abstract class BaseControl<TValue = unknown> extends ProtectedControl<TValue> {
  name = "root";
  parent: BaseControl<any> = this;
  // protected isValid = true;
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

  abstract getIsValid(): boolean;

  abstract getIsPending(): boolean;

  abstract getIsTouched(): boolean;
  abstract setIsTouched(isTouched: boolean): void;

  abstract getState(): ControlState;
  abstract resetState(): void;

  abstract reset(): void;
  /** for children controls to bubble isValid */
  // abstract checkIsValid(): void;
  /**
   * Only copy the following:
   * - item: default value
   * - group: initial controls
   * - list: sampleControl
   * - current validators and async validators
   */
  abstract clone(): this;

  constructor(options: ControlOptions<TValue> = {}) {
    super();

    if (options.validators) {
      this.validator.add(options.validators);
    }
    if (options.asyncValidators) {
      this.asyncValidator.add(options.asyncValidators);
    }
  }

  getIsError(): boolean {
    return !this.getIsValid() && this.getIsTouched();
  }

  getErrors(): ValidationErrors | null {
    return mergeErrors([this.syncErrors, this.asyncErrors]);
  }
  setErrors(errors: ValidationErrors | null, replace = false): void {
    this.syncErrors = replace ? errors : mergeErrors([this.syncErrors, errors]);
  }

  // ===== EVENT HANDLERS =====

  protected onValueChange(options?: ValueChangeOptions): void {
    if (!options?.mute) {
      this.notifyValueObservers();
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
    this.syncErrors = errors;

    if (errors) {
      options?.onError?.(errors);
    }
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

  // validate(options?: ValidateOptions) {
  //   if (this.asyncValidator.isActive) {
  //     this.validateSync(options);
  //     this.validateAsync(options);
  //   } else {
  //     this.validateSync(options);
  //   }
  // }

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
