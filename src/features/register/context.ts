import { createContexts, UseFormOptions } from "@lib/react";
import { isEmailAvailable, isUsernameAvailable } from "./service";

export interface RegisterFormValues {
  email: string;
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
    email: "",
    username: "",
    age: 0,
    password: "",
    confirmPassword: "",
  },
  changeValidators: {
    email: ({ value }) => {
      const email = value.trim();

      if (!email) {
        return "Required";
      }

      if (email.length < 3) {
        return "Please enter at least 3 characters";
      }

      return null;
    },
    username: ({ value }) => {
      return value.trim() ? "Required" : null;
    },
    age: ({ value }) => {
      if (typeof value !== "number" || isNaN(value)) {
        return "Please enter a valid age";
      }

      if (value < 18) {
        return "You must be at least 18 or older";
      }

      return null;
    },
  },
  changeAsyncValidators: {
    email: async ({ value }) => {
      return (await isEmailAvailable(value)) ? null : "This email is already in use";
    },
  },
  blurAsyncValidators: {
    username: async ({ value }) => {
      return (await isUsernameAvailable(value)) ? null : "This username is already in use";
    },
  },
};
