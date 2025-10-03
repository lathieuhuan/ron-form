import { ItemControl } from "@lib/core/controls/ItemControl";
import { ParentControl } from "../ParentControl";
import { ParentControlOptions } from "@lib/core/types";

export type ItemControlValue = string | undefined;

export class TestParentControl extends ParentControl<ItemControlValue[]> {
  controlSet: Set<ItemControl<ItemControlValue>> = new Set();

  constructor(options: ParentControlOptions<ItemControlValue[]> = {}) {
    super(options);
    const control1 = new ItemControl<ItemControlValue>();
    const control2 = new ItemControl<ItemControlValue>();
    control1.parent = this;
    control1.name = "control-1";
    control2.parent = this;
    control2.name = "control-2";
    this.controlSet.add(control1);
    this.controlSet.add(control2);
  }

  getControl(path: [0 | 1]) {
    return Array.from(this.controlSet).at(path[0])!;
  }

  getValue() {
    return Array.from(this.controlSet).map((control) => control.getValue());
  }
  setValue() {}
  patchValue() {}
  clone() {
    return this;
  }
}
