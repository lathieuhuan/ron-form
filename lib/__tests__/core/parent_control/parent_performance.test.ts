import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { describe, expect, test, vi } from "vitest";

// We test performance of the ParentControl via GroupControl

describe("ParentControl performance", () => {
  test("after parent GroupControl setValue, all observers should be called only once", () => {
    // Set up
    const child1 = new ItemControl("");
    const child2 = new ItemControl("");
    const parent = new GroupControl({
      child1,
      child2,
    });
    const grand = new GroupControl({
      parent,
    });
    const grandObserver = vi.fn();
    const parentObserver = vi.fn();
    const child1Observer = vi.fn();
    const child2Observer = vi.fn();
    grand.subscribe(grandObserver);
    parent.subscribe(parentObserver);
    child1.subscribe(child1Observer);
    child2.subscribe(child2Observer);
    // Act
    parent.setValue({ child1: "1" });
    // Assert
    expect(grandObserver).toHaveBeenCalledOnce();
    expect(parentObserver).toHaveBeenCalledOnce();
    expect(child1Observer).toHaveBeenCalledOnce();
    expect(child2Observer).toHaveBeenCalledOnce();
  });

  test("after parent GroupControl patchValue, all observers except the ones of unchanged ItemControls should be called only once", () => {
    // Set up
    const child1 = new ItemControl("");
    const child2 = new ItemControl("");
    const parent = new GroupControl({
      child1,
      child2,
    });
    const grand = new GroupControl({
      parent,
    });
    const grandObserver = vi.fn();
    const parentObserver = vi.fn();
    const child1Observer = vi.fn();
    const child2Observer = vi.fn();
    grand.subscribe(grandObserver);
    parent.subscribe(parentObserver);
    child1.subscribe(child1Observer);
    child2.subscribe(child2Observer);
    // Act
    parent.patchValue({ child1: "1" });
    // Assert
    expect(grandObserver).toHaveBeenCalledOnce();
    expect(parentObserver).toHaveBeenCalledOnce();
    expect(child1Observer).toHaveBeenCalledOnce();
    expect(child2Observer).not.toHaveBeenCalled();
  });
});
