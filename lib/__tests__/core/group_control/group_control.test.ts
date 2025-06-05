import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { describe, it, expect } from "vitest";

describe("GroupControl", () => {
  it("should create a group control", () => {
    const group = new GroupControl({
      name: new ItemControl("name"),
    });

    const a = group.getValue();
  });
});
