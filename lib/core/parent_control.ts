import { BaseControl } from "./base_control";
import {
  ComposableAsyncValidators,
  ComposableValidators,
  ControlState,
  NamePath,
  ValidateAllOptions,
  ValidateOptions,
  ValidationErrors,
} from "./types";

export type ParentControlOptions = {
  /** Whether to listen to the state of the children. Default to true. */
  isAttentive?: boolean;
};

/**
 * ParentControl has its own validators and errors,
 * but its status is determined by its own status and the status of its controls.
 */

export abstract class ParentControl<TValue = unknown> extends BaseControl<TValue> {
  override parent: ParentControl<any> = this;
  isAttentive: boolean;
  controlSet: Set<BaseControl<any>> = new Set();

  constructor(
    validators: ComposableValidators<TValue> | null = null,
    asyncValidators: ComposableAsyncValidators<TValue> | null = null,
    options: ParentControlOptions = {},
  ) {
    super(validators, asyncValidators);
    this.isAttentive = options.isAttentive ?? true;
    this.validateSync({ isBubbling: false });
  }

  // patchValue(value: TValue, options?: object): void {
  // }

  abstract getControl(path: NamePath): BaseControl<any> | undefined;

  getIsValid(): boolean {
    for (const control of this.controlSet) {
      if (!control.getIsValid()) {
        return false;
      }
    }
    return this.isValid;
  }

  getIsPending(): boolean {
    for (const control of this.controlSet) {
      if (control.getIsPending()) {
        return true;
      }
    }
    return this.isPending;
  }

  getIsTouched(): boolean {
    for (const control of this.controlSet) {
      if (control.getIsTouched()) {
        return true;
      }
    }
    return false;
  }

  setIsTouched(isTouched: boolean): void {
    this.controlSet.forEach((control) => {
      control.setIsTouched(isTouched);
      control.notifyStateObservers({ isBubbling: false });
    });
    this.notifyStateObservers();
  }

  getState(): ControlState {
    const isValid = this.getIsValid();
    const isTouched = this.getIsTouched();

    return {
      isValid,
      isPending: this.getIsPending(),
      isTouched,
      isError: !isValid && isTouched,
      errors: this.errors,
    };
  }

  resetValue(): void {
    this.controlSet.forEach((control) => control.resetValue());
    this.notifyObservers();
    // TODO: abort async validator
  }

  reset(): void {
    this.controlSet.forEach((control) => control.reset());
    this.notifyObservers();
    this.resetState();
    // TODO: abort async validator
  }

  setFieldValue(path: NamePath, value: any): void {
    this.getControl(path)?.setValue(value);
  }

  getFieldValue(path: NamePath): any {
    return this.getControl(path)?.getValue();
  }

  validateField(path: NamePath, options?: ValidateOptions): ValidationErrors | null {
    return this.getControl(path)?.validate(options) ?? null;
  }

  validateAllChildren(options?: ValidateOptions) {
    for (const control of this.controlSet) {
      control.validateSync(options);

      if (control instanceof ParentControl) {
        control.validateAllChildren(options);
      }
    }
  }

  validateAll(options?: ValidateAllOptions): boolean {
    const _options = {
      ...options,
      isBubbling: false,
    };

    this.validateSync(_options);
    this.validateAllChildren(_options);
    return this.getIsValid();
  }

  resetFieldValue(path: NamePath): void {
    this.getControl(path)?.resetValue();
  }

  resetField(path: NamePath): void {
    this.getControl(path)?.reset();
  }

  checkIsValid(): void {
    if (this.isAttentive) {
      this.validateSync(); // also notifyStateObservers

      if (this.parent instanceof ParentControl && this.parent !== this) {
        this.parent.checkIsValid();
      }
    }
  }
}
