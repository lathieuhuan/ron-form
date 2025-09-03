import { describe, expect, it, test } from "vitest";
import { ItemControl } from "../../ItemControl";
import { ListControl } from "../ListControl";

describe("ListControl", () => {
  describe("constructor & getControl", () => {
    test("default initial state", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>());

      // Assert
      expect(control.getItems().length).toBe(0);
      expect(control.getValue()).toEqual(undefined);
      expect(control["isTouched"]).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsPending()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    describe("when passed initialValues, should create item controls as many as initialValues", () => {
      test("each control should have the corresponding initial value", () => {
        // Set up
        const control = new ListControl(new ItemControl<string>(), {
          initialValues: ["111", "222", "333"],
        });
        const [item0, item1, item2] = control.getItems();

        // Assert
        expect(control.getItems().length).toBe(3);
        expect(item0.control.getValue()).toBe("111");
        expect(item1.control.getValue()).toBe("222");
        expect(item2.control.getValue()).toBe("333");
        expect(control.getValue()).toEqual(["111", "222", "333"]);
        expect(item0.control.getIsTouched()).toBe(false);
        expect(item1.control.getIsTouched()).toBe(false);
        expect(item2.control.getIsTouched()).toBe(false);
        expect(control["isTouched"]).toBe(false);
        expect(control.getIsValid()).toBe(true);
        expect(control.getIsError()).toBe(false);
        expect(control.getErrors()).toEqual(null);
      });

      test("when an initial value is undefined, the item control should has its initial value", () => {
        // Set up
        const control = new ListControl(new ItemControl<string>("item"), {
          initialValues: ["abc", undefined],
        });

        // Assert
        expect(control.getItems().length).toBe(2);
        expect(control.getControl([0])?.getValue()).toBe("abc");
        expect(control.getControl([1])?.getValue()).toBe("item");
        expect(control.getValue()).toEqual(["abc", "item"]);
      });
    });

    test("initial state with validators & valid initialValues", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["abc"],
        validators: [(c) => (c.getValue()?.at(0) === "xxx" ? { error: "error" } : null)],
      });

      // Assert
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    test("initial state with validators & invalid initialValues", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["xxx"],
        validators: [(c) => (c.getValue()?.at(0) === "xxx" ? { error: "error" } : null)],
      });

      // Assert
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual({ error: "error" });
    });
  });

  describe("getValue", () => {
    test("getValue should return children's values in an array", () => {
      // Set up
      const control = new ListControl(new ItemControl<string | undefined>(), {
        initialValues: ["111", "222"],
      });

      // Assert
      expect(control.getValue()).toEqual(["111", "222"]);
    });

    test("getValue should return undefined when the list control has no children and is not touched", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>());

      // Assert
      expect(control.getValue()).toBeUndefined();
    });
  });

  describe("setValue", () => {
    it("should set each child's value to the passed value respectively", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "222", "333"],
      });
      const [item0, item1, item2] = control.getItems();
      expect(item0.control.getValue()).toBe("111");
      expect(item1.control.getValue()).toBe("222");
      expect(item2.control.getValue()).toBe("333");

      // Act
      control.setValue(["abc", undefined, "xyz"]);

      // Assert
      expect(item0.control.getValue()).toBe("abc");
      expect(item1.control.getValue()).toBeUndefined();
      expect(item2.control.getValue()).toBe("xyz");
    });

    it("should set values of the children that are out of the passed array's range to undefined", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "222"],
      });
      const [item0, item1] = control.getItems();

      // Act
      control.setValue(["333"]);

      // Assert
      expect(item0.control.getValue()).toBe("333");
      expect(item1.control.getValue()).toBeUndefined();
    });

    it("should set all children's value to undefined when passed undefined", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "222"],
      });
      const [item0, item1] = control.getItems();
      expect(item0.control.getValue()).toBe("111");
      expect(item1.control.getValue()).toBe("222");

      // Act
      control.setValue(undefined);

      // Assert
      expect(item0.control.getValue()).toBeUndefined();
      expect(item1.control.getValue()).toBeUndefined();
    });
  });

  test(`patchValue should set each child's value to the passed value respectively,
    if a value is undefined, the child at the same index will keep its value,
    the children that are out of the passed array's range will also keep their values`, () => {
    // Set up
    const control = new ListControl(new ItemControl<string>(), {
      initialValues: ["111", "222", "333", "444"],
    });
    const [item0, item1, item2, item3] = control.getItems();
    expect(item0.control.getValue()).toBe("111");
    expect(item1.control.getValue()).toBe("222");
    expect(item2.control.getValue()).toBe("333");

    // Act
    control.patchValue(["abc", undefined, "xyz"]);

    // Assert
    expect(item0.control.getValue()).toBe("abc");
    expect(item1.control.getValue()).toBe("222");
    expect(item2.control.getValue()).toBe("xyz");
    expect(item3.control.getValue()).toBe("444");
  });

  describe("getIsTouched & setIsTouched", () => {
    test("getIsTouched should return false when the list control's and its children's isTouched are false", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "222"],
      });

      // Assert
      expect(control.getControl([0])?.getIsTouched()).toBe(false);
      expect(control.getControl([1])?.getIsTouched()).toBe(false);
      expect(control["isTouched"]).toBe(false);
    });

    test("getIsTouched should return true when the list control's isTouched is true", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "222"],
      });

      // Act
      control["isTouched"] = true;

      // Assert
      expect(control.getIsTouched()).toBe(true);
    });

    test("getIsTouched should return true when one of its item controls' isTouched is true", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "222"],
      });
      expect(control["isTouched"]).toBe(false);

      // Act
      control.getControl([0])?.setIsTouched(true);

      // Assert
      expect(control.getIsTouched()).toBe(true);
    });

    test("setIsTouched should set list control's and its item controls' isTouched to the passed value", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "222"],
      });

      // Act
      control.setIsTouched(true);

      // Assert
      expect(control.getIsTouched()).toBe(true);
      expect(control.getControl([0])?.getIsTouched()).toBe(true);
      expect(control.getControl([1])?.getIsTouched()).toBe(true);

      // Act
      control.setIsTouched(false);

      // Assert
      expect(control.getIsTouched()).toBe(false);
      expect(control.getControl([0])?.getIsTouched()).toBe(false);
      expect(control.getControl([1])?.getIsTouched()).toBe(false);
    });
  });

  describe("insertItem", () => {
    it("should insert new item at the end of the list by default and return the inserted item", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>("value"), {
        initialValues: ["111", "333"],
      });

      // Act
      const item = control.insertItem();

      // Assert
      const insertedItem = control.getControl([2]);

      expect(control.getItems().length).toBe(3);
      expect(item).toBeDefined();
      expect(insertedItem).toBeDefined();
      expect(insertedItem).toBe(item?.control);
      expect(item?.control.getValue()).toBe("value");
    });

    it("should insert new item to the specified index", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "333"],
      });

      // Act
      control.insertItem("222", 1);

      // Assert
      expect(control.getItems().length).toBe(3);
      expect(control.getControl([1])?.getValue()).toBe("222");
    });

    it("should insert new item with default value to the specified index when passed undefined as value", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>("value"), {
        initialValues: ["111", "333"],
      });

      // Act
      control.insertItem(undefined, 1);

      // Assert
      expect(control.getControl([1])?.getValue()).toBe("value");
    });

    it("should return undefined when index is out of range", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "333"],
      });

      // Act
      const item1 = control.insertItem(undefined, 3);

      // Assert
      expect(control.getItems().length).toBe(2);
      expect(item1).toBeUndefined();

      // Act
      const item2 = control.insertItem(undefined, -1);

      // Assert
      expect(control.getItems().length).toBe(2);
      expect(item2).toBeUndefined();
    });
  });

  describe("insertItems", () => {
    it("should insert n new items at the end of the list and return the inserted items when n is passed as the first argument", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>("value"), {
        initialValues: ["111"],
      });

      // Act
      const insertedItems = control.insertItems(2);

      // Assert
      expect(control.getItems().length).toBe(3);
      expect(insertedItems).toBeDefined();

      const [item1, item2] = insertedItems ?? [];

      expect(item1.control).toBeDefined();
      expect(item2.control).toBeDefined();
      expect(item1.control).toBe(control.getControl([1]));
      expect(item2.control).toBe(control.getControl([2]));
      expect(item1.control.getValue()).toBe("value");
      expect(item2.control.getValue()).toBe("value");
    });

    it("should insert n new items with specified values at the specified index when passed an array of values", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "444"],
      });

      // Act
      const insertedItems = control.insertItems(["222", "333"], 1);

      // Assert
      expect(control.getItems().length).toBe(4);
      expect(insertedItems).toBeDefined();

      const [item1, item2] = insertedItems ?? [];

      expect(item1.control).toBeDefined();
      expect(item2.control).toBeDefined();
      expect(item1.control).toBe(control.getControl([1]));
      expect(item2.control).toBe(control.getControl([2]));
      expect(item1.control.getValue()).toBe("222");
      expect(item2.control.getValue()).toBe("333");
    });

    it("should return undefined when index is out of range", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "333"],
      });

      // Act
      const insertedItems = control.insertItems(2, 3);

      // Assert
      expect(control.getItems().length).toBe(2);
      expect(insertedItems).toBeUndefined();

      // Act
      const insertedItems2 = control.insertItems(2, -1);

      // Assert
      expect(control.getItems().length).toBe(2);
      expect(insertedItems2).toBeUndefined();
    });
  });

  describe("removeItem", () => {
    test("removeItem should remove the item with the specified id and return the removed item", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "333"],
      });
      const insertedItem = control.insertItem("222", 1);
      expect(insertedItem).toBeDefined();

      if (insertedItem) {
        // Act
        const removedItem = control.removeItem(insertedItem.id);

        // Assert
        expect(control.getItems().length).toBe(2);
        expect(control.getValue()).toEqual(["111", "333"]);
        expect(removedItem).toBeDefined();
        expect(removedItem?.id).toBe(insertedItem.id);
        expect(removedItem?.control).toBe(insertedItem.control);
      }
    });

    test("removeItem should return undefined when the item with the specified id is not found", () => {
      // Set up
      const control = new ListControl(new ItemControl<string>(), {
        initialValues: ["111", "333"],
      });

      // Act
      const removedItem = control.removeItem(100);

      // Assert
      expect(control.getItems().length).toBe(2);
      expect(removedItem).toBeUndefined();
    });
  });

  test("removeItems should remove the items that match the filter and return the removed items", () => {
    // Set up
    const control = new ListControl(new ItemControl<string>(), {
      initialValues: ["111", "_222", "333", "_444", "555"],
    });
    const [_, item1, __, item3] = control.getItems();

    // Act
    const removedItems = control.removeItems(
      (item) => item.control.getValue()?.startsWith("_") ?? false,
    );

    // Assert
    expect(control.getItems().length).toBe(3);
    expect(control.getValue()).toEqual(["111", "333", "555"]);
    expect(removedItems).toBeDefined();
    expect(removedItems.length).toBe(2);
    expect(removedItems[0]).toBe(item1);
    expect(removedItems[1]).toBe(item3);
  });

  test("clearItems should remove all items", () => {
    // Set up
    const control = new ListControl(new ItemControl<string>(), {
      initialValues: ["111", "333"],
    });

    // Act
    control.clearItems();

    // Assert
    expect(control.getItems().length).toBe(0);
    expect(control.getValue()).toEqual(undefined);
  });
});
