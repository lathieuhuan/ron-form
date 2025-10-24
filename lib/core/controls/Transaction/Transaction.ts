import type { Noop } from "@lib/core/types";
import type { BaseControl } from "../BaseControl";

export class Transaction<
  TControl extends BaseControl<any> = BaseControl,
  TValue = ReturnType<TControl["getValue"]>,
> {
  value: TValue | undefined;
  // state: ControlState;
  // control: TControl;
  paused = false;

  constructor(control: TControl) {
    this.value = control.getValue();
    // this.state = control.getState();
    // this.control = control;
    // this.control["inTransaction"] = true;
  }

  pause(): void {
    this.paused = true;
  }

  continue: Noop = () => {};

  setValue(value: TValue | undefined): void {
    this.value = value;
  }

  // setState(state: Partial<ControlState>): void {
  //   Object.assign(this.state, state);
  // }

  // commit(): void {
  //   if (!this.paused) {
  //     this.control.setValue(this.value);
  //     this.control["inTransaction"] = false;
  //   }
  // }
}
