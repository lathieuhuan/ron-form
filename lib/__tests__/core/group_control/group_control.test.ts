import { setupResume } from "@lib/__tests__/core/test_utils";
import { GroupControl } from "@lib/core/group_control";
import { ControlState } from "@lib/core/types";
import { describe, expect, test, vi } from "vitest";
import {
  GROUP_ERRORS,
  INITIAL_VALUE_1,
  makeInvalidGroup,
  makeValidGroup,
} from "./group_control.test_utils";

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
      expect(control.errors).toEqual(null);
    });

    test("initial state with validators & valid initial value / on ItemControl", () => {
      // Set up
      const control = makeValidGroup("item");
      // Assert
      expect(control.getValue()).toEqual({
        value1: INITIAL_VALUE_1,
        value2: undefined,
      });
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsPending()).toBe(false);
      expect(control.errors).toEqual(null);
    });

    test("initial state with validators & valid initial value / on GroupControl ", () => {
      // Set up
      const control = makeValidGroup("group");
      // Assert
      expect(control.getValue()).toEqual({
        value1: INITIAL_VALUE_1,
        value2: undefined,
      });
      expect(control.getIsTouched()).toBe(false);
      expect(control.getIsValid()).toBe(true);
      expect(control.getIsPending()).toBe(false);
      expect(control.errors).toEqual(null);
    });

    test("initial state with validators & invalid initial value / on ItemControl", () => {
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
      expect(control.errors).toEqual(null); // errors are on ItemControl
    });

    test("initial state with validators & invalid initial value / on GroupControl", () => {
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
      expect(control.errors).toEqual(GROUP_ERRORS);
    });
  });

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

    test("change value of a single ItemControl, in a sub-group", () => {
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

    test("change value of multiple ItemControls", () => {
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

  test("setValue", () => {
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
});
