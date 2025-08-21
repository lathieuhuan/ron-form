import { BaseControl } from "../BaseControl";
import {
  ControlState,
  NamePath,
  ParentControlOptions,
  ValidateAllOptions,
  ValidateOptions,
  ValidationErrors,
} from "../../types";

/**
 * ParentControl has its own validators and errors,
 * but its status is determined by its own status and the status of its controls.
 */

export abstract class ParentControl<TValue = unknown> extends BaseControl<TValue> {
  override parent: ParentControl<any> = this;
  isAttentive: boolean;
  // Child control class needs to populate this set
  controlSet: Set<BaseControl<any>> = new Set();

  constructor(options: ParentControlOptions<TValue> = {}) {
    super(options);
    this.isAttentive = options.isAttentive ?? true;
  }

  abstract getControl(path: NamePath): BaseControl<any> | undefined;

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
    this.controlSet.forEach((control) => control.resetValue());
  }

  resetState(): void {
    this.controlSet.forEach((control) => control.resetState());
    this.setErrors(null, true);
  }

  reset(): void {
    this.controlSet.forEach((control) => control.reset());
    this.abortAsyncValidation();
  }

  // checkIsValid(): void {
  //   if (this.isAttentive) {
  //     this.validateSync();

  //     if (this.parent instanceof ParentControl && this.parent !== this) {
  //       this.parent.checkIsValid();
  //     }
  //   }
  // }

  validateAllSync(options?: ValidateOptions) {
    for (const control of this.controlSet) {
      control.validateSync(options);

      if (control instanceof ParentControl) {
        control.validateAllSync(options);
      }
    }
  }

  // validateAll(options?: ValidateAllOptions): boolean {
  //   this.validateSync(options);
  //   this.validateAllChildren(options);
  //   return this.getIsValid();
  // }

  // ===== DELEGATE to child controls =====

  setFieldValue(path: NamePath, value: any): void {
    this.getControl(path)?.setValue(value);
  }

  getFieldValue(path: NamePath): any {
    return this.getControl(path)?.getValue();
  }

  validateField(path: NamePath, options?: ValidateOptions): ValidationErrors | null {
    return this.getControl(path)?.validate(options) ?? null;
  }

  resetFieldValue(path: NamePath): void {
    this.getControl(path)?.resetValue();
  }

  resetField(path: NamePath): void {
    this.getControl(path)?.reset();
  }
}
