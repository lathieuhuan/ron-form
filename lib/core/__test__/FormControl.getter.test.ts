import { describe, expect, it } from "vitest";
import { FormControl } from "../FormControl";

const defaultValues = {
  name: "John",
  email: "john@example.com",
  profile: {
    age: 30,
  },
};

describe("FormControl getters", () => {
  describe("getFieldValue", () => {
    it("returns shallow field values", () => {
      const form = new FormControl({ defaultValues });

      expect(form.getFieldValue("name")).toBe("John");
    });

    it("returns nested field values", () => {
      const form = new FormControl({ defaultValues });

      expect(form.getFieldValue("profile.age")).toBe(30);
    });
  });

  describe("getFieldMeta", () => {
    it("returns default meta for fresh fields", () => {
      const form = new FormControl({ defaultValues });

      expect(form.getFieldMeta("name")).toEqual({
        isTouched: false,
        isDirty: false,
        isValidating: false,
      });
    });

    it("returns stored meta after it has been set", () => {
      const form = new FormControl({ defaultValues });
      const meta = {
        isTouched: true,
        isDirty: true,
        isValidating: false,
      };

      form.setFieldMeta("name", meta);

      expect(form.getFieldMeta("name")).toEqual(meta);
    });
  });

  describe("getFieldErrorMap", () => {
    it("returns an empty error map for fresh fields", () => {
      const form = new FormControl({ defaultValues });

      expect(form.getFieldErrorMap("name")).toEqual({
        change: [],
        blur: [],
        changeAsync: [],
        blurAsync: [],
      });
    });

    it("returns stored errors after validation", () => {
      const form = new FormControl({
        defaultValues,
        changeValidators: {
          email: () => "Invalid email",
        },
      });

      form.setFieldValue("email", "bad");

      expect(form.getFieldErrorMap("email").change).toEqual([
        {
          path: "email",
          type: "change",
          message: "Invalid email",
          meta: {},
        },
      ]);
    });
  });
});
