import { DeepKeys, FormApi } from "@lib/core";
import { useMemo, useState } from "react";
import { FormSupervisorContext } from "./context";

type FormSupervisorProps = {
  form: FormApi<any>;
  children: React.ReactNode;
};

export function FormSupervisor({ form, children }: FormSupervisorProps) {
  const [watchedField, setWatchedField] = useState<DeepKeys<any>>("");

  const value = useMemo(() => {
    return {
      form,
      watchedField,
      setWatchedField,
    };
  }, [form, watchedField]);

  return <FormSupervisorContext.Provider value={value}>{children}</FormSupervisorContext.Provider>;
}
