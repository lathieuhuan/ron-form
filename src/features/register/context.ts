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
  },
  blurValidators: {
    username: ({ value }) => {
      const username = value.trim();

      if (!username) {
        return "Required";
      }

      return username.length < 3 ? "Please enter at least 3 characters" : null;
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
  onSubmit: ({ values }) => {
    console.log(values);
  },
  onSubmitFailed: () => {
    console.log("Submit failed");
  },
};
