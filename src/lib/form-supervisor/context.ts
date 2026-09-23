import { DeepNames, FormApi } from "@lib/core";
import { createContext, useContext } from "react";

export interface FormSupervisorContextValue<TFormValues> {
  form: FormApi<TFormValues>;
  watchedField: DeepNames<TFormValues>;
  setWatchedField: (field: DeepNames<TFormValues>) => void;
}

export const FormSupervisorContext = createContext<FormSupervisorContextValue<any> | null>(null);

export function useFormSupervisor() {
  const context = useContext(FormSupervisorContext);
  if (!context) {
    throw new Error("useFormSupervisor must be used within a FormSupervisorProvider");
  }
  return context;
}
