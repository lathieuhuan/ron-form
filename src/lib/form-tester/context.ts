import { FormApi } from "@lib/core/FormControl";
import { DeepKeys } from "@lib/core/types";
import { createContext, useContext } from "react";

export interface FormTesterContextValue<TFormValues> {
  form: FormApi<TFormValues>;
  watchedField: DeepKeys<TFormValues>;
  setWatchedField: (field: DeepKeys<TFormValues>) => void;
}

export const FormTesterContext = createContext<FormTesterContextValue<any> | null>(null);

export function useFormTester() {
  const context = useContext(FormTesterContext);
  if (!context) {
    throw new Error("useFormTester must be used within a FormTesterProvider");
  }
  return context;
}
