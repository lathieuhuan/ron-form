import { delay } from "@lib/core/utils/delay";
import { createContexts, UseFormOptions } from "@lib/react";

export type PastJob = {
  id: string;
  companyName: string;
  startYear: number | null;
};

export interface PastJobsFormValues {
  pastJobs: PastJob[];
}

export const { FormContext, Form, FormMeta, Field, useForm, useFormInstance } =
  createContexts<PastJobsFormValues>();

const require = ({ value }: { value?: string | number | null }) => {
  if (value == null || (typeof value === "string" && value.trim() === "")) {
    return "Required";
  }

  return null;
};

export const useFormOptions: UseFormOptions<PastJobsFormValues> = {
  defaultValues: {
    pastJobs: [],
  },
  changeValidators: {
    pastJobs: ({ value }) => {
      return value.length > 0 ? null : "At least one past job is required";
    },
    "pastJobs.[n].companyName": require,
  },
  blurAsyncValidators: {
    "pastJobs.[n].startYear": async ({ value }) => {
      await delay(500);
      return value == null || value < 2021 ? null : "Start year must be before 2021";
    },
  },
  onSubmit: ({ values }) => {
    console.log("onSubmit");
    console.log(values);
  },
  onSubmitFailed: ({ errors }) => {
    console.log("onSubmitFailed");
    console.log(errors);
  },
};
