import { BaseControl } from "../BaseControl";
import {
  ControlState,
  NamePath,
  ParentControlOptions,
  ValidateOptions,
  ValidationErrors,
} from "../../types";

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
  //   this.validateSync();
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

  resetValue(): void {
    this.isAttentive = false;
    this.controlSet.forEach((control) => control.resetValue());
    this.isAttentive = true;
    // this.onValueChange();
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

  // run validateSync on all descendants
  validateSyncDescendants(options?: ValidateOptions) {
    for (const control of this.controlSet) {
      control.validateSync(options);

      if (control instanceof ParentControl) {
        control.validateSyncDescendants(options);
      }
    }
  }

  // validateAll(options?: ValidateAllOptions): boolean {
  //   this.validateSync(options);
  //   this.validateAllChildren(options);
  //   return this.getIsValid();
  // }

  // ===== DELEGATE to child controls =====

  getFieldValue(path: NamePath): any {
    return this.getControl(path)?.getValue();
  }

  setFieldValue(path: NamePath, value: any): void {
    this.getControl(path)?.setValue(value);
  }

  // validateField(path: NamePath, options?: ValidateOptions): ValidationErrors | null {
  //   return this.getControl(path)?.validate(options) ?? null;
  // }

  resetFieldValue(path: NamePath): void {
    this.getControl(path)?.resetValue();
  }

  resetField(path: NamePath): void {
    this.getControl(path)?.reset();
  }
}
