import { ItemControl } from "@lib/core/item_control";
import { ParentControl } from "@lib/core/parent_control";
import { ParentControlOptions } from "@lib/core/types";

export class TestParentControl extends ParentControl<string[]> {
  constructor(options: ParentControlOptions<string[]> = {}) {
    super(options);
    this.controlSet.add(new ItemControl(""));
    this.controlSet.add(new ItemControl(""));
  }

  getControl(path: number[]) {
    return Array.from(this.controlSet).at(path[0]);
  }

  getValue() {
    return [];
  }
  setValue() {}
  patchValue() {}
  clone() {
    return this;
  }
}
