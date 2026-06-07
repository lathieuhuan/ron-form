import { createContexts } from "@lib/react";

export interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
}

export const { FormContext, Form, Field, useForm, useFormInstance } =
  createContexts<RegisterFormValues>();
