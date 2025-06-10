import { setupResume } from "@lib/__tests__/test_utils";
import { describe, expect, test } from "vitest";

describe("GroupControl", () => {
  test("getControl", () => {
    const { resume, role, general, skills, experiences } = setupResume();

    expect(resume.getControl(["role"])).toBe(role);
    expect(resume.getControl(["general"])).toBe(general);
    expect(resume.getControl(["skills"])).toBe(skills);
    expect(resume.getControl(["experiences"])).toBe(experiences);
    expect(resume.getControl(["general", "age"])).toBe(general.getControl(["age"]));
  });

  test("getValue", () => {
    const { resume, role, name, general, skills, experiences, initialValues } = setupResume();

    expect(role.getValue()).toEqual(initialValues.role);
    expect(general.getValue()).toEqual(initialValues.general);
    expect(name.getValue()).toEqual(initialValues.general.name);
    expect(skills.getValue()).toEqual(undefined);
    expect(experiences.getValue()).toEqual(undefined);
    expect(resume.getValue()).toEqual(initialValues);
  });

  describe("patchValue", () => {
    test("change value of a single independent ItemControl", () => {
      // Set up
      const newRole = "new role";
      const { resume, general, role, contact, skills, experiences, initialValues } = setupResume();
      // Act
      resume.patchValue({
        role: newRole,
      });
      // Assert
      expect(role.getValue()).toEqual(newRole);
      // Others are the same
      expect(general.getValue()).toEqual(initialValues.general);
      expect(contact.getValue()).toEqual(initialValues.contact);
      expect(skills.getValue()).toEqual(undefined);
      expect(experiences.getValue()).toEqual(undefined);
      expect(resume.getValue()).toEqual({
        ...initialValues,
        role: newRole,
      });
    });

    test("change value of single ItemControl, in a Group", () => {
      // Set up
      const newName = "new name";
      const { resume, role, general, name, contact, skills, experiences, initialValues } =
        setupResume();
      // Act
      resume.patchValue({
        general: {
          name: newName,
        },
      });
      // Assert
      expect(name.getValue()).toEqual(newName);
      expect(general.getValue()).toEqual({
        ...initialValues.general,
        name: newName,
      });
      // Others are the same
      expect(role.getValue()).toEqual(initialValues.role);
      expect(contact.getValue()).toEqual(initialValues.contact);
      expect(skills.getValue()).toEqual(undefined);
      expect(experiences.getValue()).toEqual(undefined);
    });

    // test("change value of single ItemControl, in a List", () => {
    //   // Set up
    //   const { resume, role, general, name, contact, skills, experiences, initialValues } =
    //     setupResume();
    // });
  });
});
