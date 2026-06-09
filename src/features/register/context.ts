import { createContexts } from "@lib/react";

export interface RegisterFormValues {
  email: string;
  username?: string;
  profession?: string;
  age: number | null;
  password: string;
  confirmPassword: string;
}

export const { FormContext, Form, Field, useForm, useFormInstance, useFormField } =
  createContexts<RegisterFormValues>();
