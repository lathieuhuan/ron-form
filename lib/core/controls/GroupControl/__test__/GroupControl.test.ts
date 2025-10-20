import { setupResume } from "@lib/core/test-utils/parent-utils";
import { describe, expect, it, test } from "vitest";
import { GROUP_ERRORS, INITIAL_VALUE, makeInvalidGroup, makeValidGroup } from "./test-utils";

describe("GroupControl", () => {
  describe("constructor", () => {
    test("initial state with no validators", () => {
      // Set up
      const control = makeValidGroup();
      // Assert
      expect(control.getValue()).toEqual({
        value1: undefined,
        value2: undefined,
      });
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsPending()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    test("initial state with validators on ItemControl & valid initial value", () => {
      // Set up
      const control = makeValidGroup("item");
      // Assert
      expect(control.getValue()).toEqual({
        value1: INITIAL_VALUE,
        value2: undefined,
      });
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsPending()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    test("initial state with validators on GroupControl & valid initial value", () => {
      // Set up
      const control = makeValidGroup("group");
      // Assert
      expect(control.getValue()).toEqual({
        value1: INITIAL_VALUE,
        value2: undefined,
      });
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsPending()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(null);
    });

    test("initial state with validators on ItemControl & invalid initial value", () => {
      // Set up
      const control = makeInvalidGroup("item");
      // Assert
      expect(control.getValue()).toEqual({
        value1: undefined,
        value2: undefined,
      });
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(false);
      expect(control.getIsPending()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(null); // errors are on ItemControl
    });

    test("initial state with validators on GroupControl & invalid initial value", () => {
      // Set up
      const control = makeInvalidGroup("group");
      // Assert
      expect(control.getValue()).toEqual({
        value1: undefined,
        value2: undefined,
      });
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(false);
      expect(control.getIsPending()).toBe(false);
      expect(control.getIsError()).toBe(false);
      expect(control.getErrors()).toEqual(GROUP_ERRORS);
    });
  });

  test("getControl", () => {
    const { resume, role, general, skills, experiences } = setupResume();

    expect(resume.getControl(["role"])).toBe(role); // item
    expect(resume.getControl(["general"])).toBe(general); // group
    expect(resume.getControl(["skills"])).toBe(skills); // list
    expect(resume.getControl(["experiences"])).toBe(experiences); // list of groups
    expect(resume.getControl(["general", "age"])).toBe(general.getControl(["age"])); // nested item
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

  describe("_patchValue", () => {
    it("changes value of a single independent ItemControl", () => {
      // Set up
      const NEW_ROLE = "new role";
      const { resume, general, role, contact, skills, experiences, initialValues } = setupResume();

      // Act
      resume.patchValue({
        role: NEW_ROLE,
      });

      // Assert
      expect(role.getValue()).toEqual(NEW_ROLE);
      // Others are the same
      expect(general.getValue()).toEqual(initialValues.general);
      expect(contact.getValue()).toEqual(initialValues.contact);
      expect(skills.getValue()).toEqual(undefined);
      expect(experiences.getValue()).toEqual(undefined);
      expect(resume.getValue()).toEqual({
        ...initialValues,
        role: NEW_ROLE,
      });
    });

    it("changes value of a single ItemControl, in a sub-group", () => {
      // Set up
      const NEW_NAME = "new name";
      const { resume, role, general, name, contact, skills, experiences, initialValues } =
        setupResume();

      // Act
      resume.patchValue({
        general: {
          name: NEW_NAME,
        },
      });

      // Assert
      expect(name.getValue()).toEqual(NEW_NAME);
      expect(general.getValue()).toEqual({
        ...initialValues.general,
        name: NEW_NAME,
      });
      // Others are the same
      expect(role.getValue()).toEqual(initialValues.role);
      expect(contact.getValue()).toEqual(initialValues.contact);
      expect(skills.getValue()).toEqual(undefined);
      expect(experiences.getValue()).toEqual(undefined);
    });

    it("changes value of multiple ItemControls", () => {
      // Set up
      const NEW_ROLE = "new role";
      const NEW_NAME = "new name";
      const NEW_EMAIL = "new email";
      const { resume, role, name, contact, skills, experiences, initialValues } = setupResume();

      // Act
      resume.patchValue({
        role: NEW_ROLE,
        general: {
          name: NEW_NAME,
        },
        contact: {
          email: NEW_EMAIL,
        },
      });

      // Assert
      expect(role.getValue()).toEqual(NEW_ROLE);
      expect(name.getValue()).toEqual(NEW_NAME);
      expect(contact.getControl(["email"]).getValue()).toEqual(NEW_EMAIL);
      // Others are the same
      expect(skills.getValue()).toEqual(undefined);
      expect(experiences.getValue()).toEqual(undefined);
      expect(resume.getValue()).toEqual({
        ...initialValues,
        role: NEW_ROLE,
        general: {
          ...initialValues.general,
          name: NEW_NAME,
        },
        contact: {
          ...initialValues.contact,
          email: NEW_EMAIL,
        },
      });
    });
  });

  test("setValue replaces every value, what not present is undefined", () => {
    // Set up
    const NEW_ROLE = "new role";
    const NEW_NAME = "new name";
    const { resume, role, name, contact, skills, experiences } = setupResume();
    // Act
    resume.setValue({
      role: NEW_ROLE,
      general: {
        name: NEW_NAME,
      },
    });

    // Assert
    expect(role.getValue()).toEqual(NEW_ROLE);
    expect(name.getValue()).toEqual(NEW_NAME);

    // Others are undefined
    expect(resume.getControl(["general", "age"]).getValue()).toEqual(undefined);
    expect(contact.getValue()).toEqual({
      email: undefined,
      phone: undefined,
    });
    expect(skills.getValue()).toEqual(undefined);
    expect(experiences.getValue()).toEqual(undefined);
    expect(resume.getValue()).toEqual({
      role: NEW_ROLE,
      general: {
        name: NEW_NAME,
        age: undefined,
      },
      contact: {
        email: undefined,
        phone: undefined,
      },
      skills: undefined,
      experiences: undefined,
    });
  });

  test("validateDescendants", () => {
    // Set up
    const { resume, role, contact, initialValues } = setupResume();
    const email = contact.getControl(["email"]);
    role.addValidator((c) => {
      return c.getValue() === initialValues.role ? { error: "role error" } : null;
    });
    email.addValidator((c) => {
      return c.getValue() === initialValues.contact.email ? { error: "email error" } : null;
    });
    expect(resume.getIsValid()).toBe(true);
    expect(role.getIsValid()).toBe(true);
    expect(email.getIsValid()).toBe(true);

    // Act
    resume["validateDescendants"]();

    // Assert
    expect(resume.getIsValid()).toBe(false);
    expect(role.getErrors()).toEqual({ error: "role error" });
    expect(email.getErrors()).toEqual({ error: "email error" });
  });

  // Methods that delegate to child controls

  test("getFieldValue", () => {
    // Set up
    const { resume, initialValues } = setupResume();

    // Act
    const roleValue = resume.getFieldValue(["role"]);
    const nameValue = resume.getFieldValue(["general", "name"]);
    expect(roleValue).toEqual(initialValues.role);
    expect(nameValue).toEqual(initialValues.general.name);
  });

  test("setFieldValue", () => {
    // Set up
    const { resume } = setupResume();

    // Act
    resume.setFieldValue(["role"], "new role");
    resume.setFieldValue(["general", "name"], "new name");
    resume.setFieldValue(["contact"], {
      email: "new email",
      phone: "new phone",
    });

    // Assert
    expect(resume.getFieldValue(["role"])).toEqual("new role");
    expect(resume.getFieldValue(["general", "name"])).toEqual("new name");
    expect(resume.getFieldValue(["contact", "email"])).toEqual("new email");
    expect(resume.getFieldValue(["contact", "phone"])).toEqual("new phone");
  });

  test("resetFieldValue", () => {
    // Set up
    const { resume, initialValues } = setupResume();

    // Act
    resume.setFieldValue(["role"], "new role");
    resume.setFieldValue(["general", "name"], "new name");
    resume.setFieldValue(["contact"], {
      email: "new email",
      phone: "new phone",
    });
    resume.resetFieldValue(["role"]);
    resume.resetFieldValue(["general", "name"]);
    resume.resetFieldValue(["contact"]);

    // Assert
    expect(resume.getFieldValue(["role"])).toEqual(initialValues.role);
    expect(resume.getFieldValue(["general", "name"])).toEqual(initialValues.general.name);
    expect(resume.getFieldValue(["contact"])).toEqual(initialValues.contact);
  });
});
