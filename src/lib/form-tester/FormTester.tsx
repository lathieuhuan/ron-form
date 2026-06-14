import { DeepKeys, FormApi } from "@lib/core";
import { useMemo, useState } from "react";
import { FormTesterContext } from "./context";

type FormTesterProps = {
  form: FormApi<any>;
  children: React.ReactNode;
};

export function FormTester({ form, children }: FormTesterProps) {
  const [watchedField, setWatchedField] = useState<DeepKeys<any>>("");

  const value = useMemo(() => {
    return {
      form,
      watchedField,
      setWatchedField,
    };
  }, [form, watchedField]);

  return <FormTesterContext.Provider value={value}>{children}</FormTesterContext.Provider>;
}
