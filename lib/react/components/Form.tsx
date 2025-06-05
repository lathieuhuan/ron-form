import { useEffect, useRef } from "react";

import { FormControl } from "@lib/core/form_control";
import { FormContext } from "../contexts/form-context";
import { ReactFormControl } from "../types";

export type FormProps<TValue = any> = {
  className?: string;
  form: ReactFormControl<TValue>;
  children: React.ReactNode;
};

export function Form<TValue = any>({ form, children, className }: FormProps<TValue>) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return (form as FormControl<TValue>).connectForm(formRef.current);
  }, [form]);

  return (
    <FormContext.Provider value={form as FormControl<TValue>}>
      <form ref={formRef} className={className}>
        {children}
      </form>
    </FormContext.Provider>
  );
}
