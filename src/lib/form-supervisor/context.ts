import { FormApi } from "@lib/core/FormControl";
import { DeepKeys } from "@lib/core/types";
import { createContext, useContext } from "react";

export interface FormSupervisorContextValue<TFormValues> {
  form: FormApi<TFormValues>;
  watchedField: DeepKeys<TFormValues>;
  setWatchedField: (field: DeepKeys<TFormValues>) => void;
}

export const FormSupervisorContext = createContext<FormSupervisorContextValue<any> | null>(null);

export function useFormSupervisor() {
  const context = useContext(FormSupervisorContext);
  if (!context) {
    throw new Error("useFormSupervisor must be used within a FormSupervisorProvider");
  }
  return context;
}
