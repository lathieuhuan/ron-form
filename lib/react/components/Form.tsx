import { useEffect, useRef } from "react";

import { FormControl, BaseControl, GroupValue } from "@lib/core";
import { FormContext } from "../contexts/form-context";

export type FormProps<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls>,
> = {
  className?: string;
  form: FormControl<TControls, TValue>;
  children: React.ReactNode;
};

export function Form<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls>,
>({ form, children, className }: FormProps<TControls, TValue>) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    return form.connectForm(formRef.current);
  }, [form]);

  return (
    <FormContext.Provider value={form}>
      <form ref={formRef} className={className}>
        {children}
      </form>
    </FormContext.Provider>
  );
}
