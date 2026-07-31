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

export const useFormOptions: UseFormOptions<PastJobsFormValues> = {
  defaultValues: {
    pastJobs: [],
  },
  changeValidators: {
    pastJobs: ({ value }) => {
      return value.length > 0 ? null : "At least one past job is required";
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
