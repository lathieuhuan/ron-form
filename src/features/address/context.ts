import { createContexts, UseFormOptions } from "@lib/react";

export interface AddressFormValues {
  street: string;
  ward: string;
  district: string;
  city: string;
}

export const { FormContext, Form, FormMeta, Field, useForm, useFormInstance, useFormField } =
  createContexts<AddressFormValues>();

export const useFormOptions: UseFormOptions<AddressFormValues> = {
  defaultValues: {
    street: "",
    ward: "",
    district: "",
    city: "",
  },
  onSubmit: ({ values }) => {
    console.log(values);
  },
  onSubmitFailed: () => {
    console.log("Submit failed");
  },
};
