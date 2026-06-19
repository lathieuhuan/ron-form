import { createContexts, UseFormOptions } from "@lib/react";

export interface AddressFormValues {
  street: string;
  ward: string;
  district: string;
  city: string;
}

export const { FormContext, Form, FormMeta, Field, useForm, useFormInstance } =
  createContexts<AddressFormValues>();

export const useFormOptions: UseFormOptions<AddressFormValues> = {
  defaultValues: {
    street: "",
    ward: "",
    district: "",
    city: "",
  },
  changeValidators: {
    street: ({ value }) => {
      return value?.trim() ? null : "Required";
    },
    ward: ({ value }) => {
      return value ? null : "Required";
    },
    district: ({ value }) => {
      return value ? null : "Required";
    },
    city: ({ value }) => {
      return value ? null : "Required";
    },
  },
  onSubmit: ({ values }) => {
    console.log(values);
  },
  onSubmitFailed: () => {
    console.log("Submit failed");
  },
};
