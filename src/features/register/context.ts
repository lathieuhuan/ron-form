import { createContexts, UseFormOptions } from "@lib/react";
import { isUsernameAvailable } from "./service";

export interface RegisterFormValues {
  firstName: string;
  username: string;
  profession?: string;
  age: number | null;
  password: string;
  confirmPassword: string;
}

export const { FormContext, Form, FormMeta, Field, useForm, useFormInstance, useFormField } =
  createContexts<RegisterFormValues>();

export const useFormOptions: UseFormOptions<RegisterFormValues> = {
  defaultValues: {
    firstName: "",
    username: "",
    age: 0,
    password: "",
    confirmPassword: "",
  },
  changeValidators: {
    firstName: ({ value }) => {
      return value.trim() ? "Required" : null;
    },
    username: ({ value }) => {
      return value.trim() ? "Required" : null;
    },
    age: ({ value }) => {
      if (typeof value !== "number" || isNaN(value)) {
        return "Please enter a valid age";
      }

      if (value < 18) {
        return "You must be at least 18 years old to register";
      }

      return null;
    },
  },
  blurAsyncValidators: {
    username: async ({ value }) => {
      return (await isUsernameAvailable(value)) ? null : "This username is already in use";
    },
  },
};
