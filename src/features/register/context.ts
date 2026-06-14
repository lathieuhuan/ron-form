import { createContexts, UseFormOptions } from "@lib/react";
import { isEmailAvailable, isEmailValid, isUsernameAvailable } from "./service";

export interface RegisterFormValues {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export const { FormContext, Form, FormMeta, Field, useForm, useFormInstance, useFormField } =
  createContexts<RegisterFormValues>();

export const useFormOptions: UseFormOptions<RegisterFormValues> = {
  defaultValues: {
    email: "",
    username: "",
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
  },
  changeAsyncValidators: {
    email: async ({ value }) => {
      return (await isEmailValid(value)) ? null : "Please enter a valid email";
    },
  },
  blurAsyncValidators: {
    email: async ({ value }) => {
      return (await isEmailAvailable(value)) ? null : "This email is already in use";
    },
    username: async ({ value }) => {
      return (await isUsernameAvailable(value)) ? null : "This username is already in use";
    },
  },
};
