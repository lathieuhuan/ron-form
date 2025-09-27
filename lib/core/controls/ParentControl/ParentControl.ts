import {
  ControlState,
  NamePath,
  ParentControlOptions,
  ValidateOptions,
  ValidationErrors,
  ValueChangeOptions,
} from "@lib/core/types";
import { BaseControl } from "../BaseControl";

/**
 * ParentControl has its own validators and errors,
 * but its status is determined by its own status and the status of its controls.
 */

export abstract class ParentControl<TValue = unknown> extends BaseControl<TValue> {
  override parent: ParentControl<any> = this;
  protected isAttentive = true;
  // Child control class needs to populate this set
  controlSet: Set<BaseControl<any>> = new Set();

  constructor(options: ParentControlOptions<TValue> = {}) {
    super(options);
    // this.isAttentive = options.isAttentive ?? true;
  }

  abstract getControl(path: NamePath): BaseControl<any> | undefined;

  // protected onValueChange(): void {
  //   this.validate();
  //   this.notifyValueObservers();
  //   this.notifyStateObservers();

  //   if (this.parent !== this && this.parent instanceof ParentControl) {
  //     this.parent.signalChange();
  //   }
  // }

  getIsValid(): boolean {
    for (const control of this.controlSet) {
      if (!control.getIsValid()) {
        return false;
      }
    }
    return this.getErrors() === null;
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
    });
  }

  getState(): ControlState {
    const isValid = this.getIsValid();
    const isTouched = this.getIsTouched();

    return {
      isValid,
      isPending: this.getIsPending(),
      isTouched,
      isError: !isValid && isTouched,
      errors: this.getErrors(),
    };
  }

  protected _resetValue(): void {
    this.isAttentive = false;
    this.controlSet.forEach((control) => control["_resetValue"]());
    this.isAttentive = true;
    // this.onValueChange();
  }
  resetValue(options?: ValueChangeOptions): void {
    this._resetValue();

    if (!options?.mute) {
      this.notifyValueObservers();
    }
  }

  resetState(): void {
    this.controlSet.forEach((control) => control.resetState());
    this.setErrors(null, true);
  }

  reset(): void {
    this.controlSet.forEach((control) => control.reset());
    this.abortAsyncValidation();
  }

  /** For children to signal a value change to this parent */
  // signalChange(): void {
  //   if (this.isAttentive) {
  //     this.onValueChange();
  //   }
  // }

  // run validate on all descendants
  validateSyncDescendants(options?: ValidateOptions) {
    for (const control of this.controlSet) {
      control.validate(options);

      if (control instanceof ParentControl) {
        control.validateSyncDescendants(options);
      }
    }
  }

  validateSyncAll(): boolean {
    this.validate();
    this.validateSyncDescendants();
    return this.getIsValid();
  }

  // ===== DELEGATE to child controls =====

  getFieldValue(path: NamePath): any {
    return this.getControl(path)?.getValue();
  }

  /** No validate */
  setFieldValue(path: NamePath, value: any): void {
    this.getControl(path)?.["_setValue"](value);
  }

  validateField(path: NamePath, options?: ValidateOptions): ValidationErrors | null {
    return this.getControl(path)?.validate(options) ?? null;
  }

  resetFieldValue(path: NamePath): void {
    this.getControl(path)?.["_resetValue"]();
  }

  resetField(path: NamePath): void {
    this.getControl(path)?.reset();
  }
}
