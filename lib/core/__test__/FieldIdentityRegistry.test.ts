import { describe, expect, it } from "vitest";
import { FieldIdentityRegistry } from "../FieldIdentityRegistry";

describe("FieldIdentityRegistry", () => {
  it("keeps an item identity when its index changes", () => {
    const values = {
      contacts: [{ name: "A" }, { name: "B" }],
    };
    const registry = new FieldIdentityRegistry<typeof values>();
    const arrayId = registry.prepareArray("contacts", values);
    const firstNameId = registry.toFieldId("contacts.0.name", values);

    expect(arrayId).not.toBeNull();
    expect(firstNameId).not.toBeNull();

    registry.swap(arrayId!, 0, 1);
    [values.contacts[0], values.contacts[1]] = [values.contacts[1], values.contacts[0]];

    expect(registry.toFieldKey(firstNameId!, values)).toBe("contacts.1.name");
    expect(registry.toFieldId("contacts.1.name", values)).toBe(firstNameId);
  });

  it("preserves nested array identities when a parent item moves", () => {
    const values = {
      groups: [
        {
          tags: [{ label: "A" }],
        },
        {
          tags: [{ label: "B" }],
        },
      ],
    };
    const registry = new FieldIdentityRegistry<typeof values>();
    const groupsId = registry.prepareArray("groups", values);
    const nestedArrayId = registry.prepareArray("groups.0.tags", values);
    const labelId = registry.toFieldId("groups.0.tags.0.label", values);

    expect(groupsId).not.toBeNull();
    expect(nestedArrayId).not.toBeNull();
    expect(labelId).not.toBeNull();

    registry.move(groupsId!, 0, 1);
    const [group] = values.groups.splice(0, 1);
    values.groups.splice(1, 0, group);

    expect(registry.toFieldKey(nestedArrayId!, values)).toBe("groups.1.tags");
    expect(registry.toFieldKey(labelId!, values)).toBe("groups.1.tags.0.label");
  });

  it("invalidates removed item and nested array identities", () => {
    const values = {
      groups: [
        {
          tags: [{ label: "A" }],
        },
      ],
    };
    const registry = new FieldIdentityRegistry<typeof values>();
    const groupsId = registry.prepareArray("groups", values);
    const nestedArrayId = registry.prepareArray("groups.0.tags", values);
    const labelId = registry.toFieldId("groups.0.tags.0.label", values);

    registry.remove(groupsId!, 0);
    values.groups.splice(0, 1);

    expect(registry.toFieldKey(nestedArrayId!, values)).toBeNull();
    expect(registry.toFieldKey(labelId!, values)).toBeNull();
  });

  it("allocates fresh identities when an array is replaced", () => {
    const values = {
      contacts: [{ name: "A" }],
    };
    const registry = new FieldIdentityRegistry<typeof values>();
    const arrayId = registry.prepareArray("contacts", values);
    const oldNameId = registry.toFieldId("contacts.0.name", values);

    const removedKeys = registry.replace(arrayId!, 1);
    values.contacts = [{ name: "B" }];
    const newNameId = registry.toFieldId("contacts.0.name", values);

    expect(removedKeys).toHaveLength(1);
    expect(newNameId).not.toBe(oldNameId);
    expect(registry.toFieldKey(oldNameId!, values)).toBeNull();
  });
});
