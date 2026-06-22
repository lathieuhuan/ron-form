import { createContexts, UseFormOptions } from "@lib/react";
import { getAddressByCitizenId } from "./service";

export interface PersonalInfoFormValues {
  name: string;
  citizenId: string;
  address: {
    street: string;
    ward: string;
    district: string;
    city: string;
  };
}

export const { FormContext, Form, FormMeta, Field, useForm, useFormInstance } =
  createContexts<PersonalInfoFormValues>();

const require = ({ value }: { value: string }) => {
  return value?.trim() ? null : "Required";
};

export const useFormOptions: UseFormOptions<PersonalInfoFormValues> = {
  defaultValues: {
    name: "",
    citizenId: "",
    address: {
      street: "",
      ward: "",
      district: "",
      city: "",
    },
  },
  changeValidators: {
    name: require,
    citizenId: require,
    "address.street": require,
    "address.ward": require,
    "address.district": require,
    "address.city": require,
  },
  blurAsyncValidators: {
    citizenId: async ({ value, form }) => {
      const address = await getAddressByCitizenId(value);

      if (address !== null) {
        form.setFieldValue("address", address);
        return null;
      }

      return "Invalid citizen ID";
    },
  },
  onSubmit: ({ values }) => {
    console.log("Submit success");
    console.log(values);
  },
  onSubmitFailed: () => {
    console.log("Submit failed");
  },
};
