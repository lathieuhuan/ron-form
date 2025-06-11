import { ItemControl } from "@lib/core/item_control";
import { ParentControl } from "@lib/core/parent_control";
import { ParentControlOptions } from "@lib/core/types";

export class TestParentControl extends ParentControl<string[]> {
  constructor(options: ParentControlOptions<string[]> = {}) {
    super(options);
    const control1 = new ItemControl("1");
    const control2 = new ItemControl("2");
    control1.parent = this;
    control2.parent = this;
    this.controlSet.add(control1);
    this.controlSet.add(control2);
    this.validateSync({ isBubbling: false });
  }

  getControl(path: number[]) {
    return Array.from(this.controlSet).at(path[0]);
  }

  getValue(): string[] {
    return Array.from(this.controlSet).map((control) => control.getValue());
  }
  setValue() {}
  patchValue() {}
  clone() {
    return this;
  }
}
