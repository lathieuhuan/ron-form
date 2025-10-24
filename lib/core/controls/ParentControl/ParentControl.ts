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
  // Child control class needs to populate this list
  controlList: BaseControl<any>[] = [];

  constructor(options: ParentControlOptions<TValue> = {}) {
    super(options);
  }

  abstract getControl(path: NamePath): BaseControl<any> | undefined;

  // ===== STATE GETTERS & SETTERS =====

  getIsValid(): boolean {
    for (const control of this.controlList) {
      if (!control.getIsValid()) {
        return false;
      }
    }
    return this.getErrors() === null;
  }

  getIsPending(): boolean {
    for (const control of this.controlList) {
      if (control.getIsPending()) {
        return true;
      }
    }
    return this.isPending;
  }

  getIsTouched(): boolean {
    for (const control of this.controlList) {
      if (control.getIsTouched()) {
        return true;
      }
    }
    return false;
  }

  setIsTouched(isTouched: boolean): void {
    this.controlList.forEach((control) => {
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

  // ===== RESET =====

  resetValue(options?: ValueChangeOptions): void {
    this.actSilently(() => {
      this.controlList.forEach((control) => control.resetValue(options));
    });
    this.onValueChange(options);
    this.abortAsyncValidation();
  }

  reset(): void {
    this.actSilently(() => {
      this.controlList.forEach((control) => control.reset());
    });
    this.syncErrors = this.validator.validate();
    this.isPending = false;
    this.onValueChange({ validate: false });
    this.abortAsyncValidation();
  }

  // ===== VALIDATION =====

  protected validateDescendants(options?: Pick<ValidateOptions, "muted">) {
    this.actSilently(() => {
      for (const control of this.controlList) {
        control.validate(options);

        if (control instanceof ParentControl) {
          control.validateDescendants(options);
        }
      }
    });
  }

  validateAll(options?: Pick<ValidateOptions, "muted">): boolean {
    this.validateDescendants(options);
    this.validate(options);

    return this.getIsValid();
  }

  // ===== DELEGATE to child controls =====

  getFieldValue(path: NamePath): any {
    return this.getControl(path)?.getValue();
  }

  setFieldValue(path: NamePath, value: any): void {
    this.getControl(path)?.setValue(value);
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
