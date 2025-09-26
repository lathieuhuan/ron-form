import { useEffect, useRef } from "react";

import { BaseControl } from "@lib/core/controls/BaseControl";
import { FormControl } from "@lib/core/form_control";
import { GroupValue } from "@lib/core/types";
import { FormContext } from "../contexts/form-context";
import { ReactFormControl } from "../types";

export type FormProps<
  TControls extends Record<string, BaseControl<any>>,
  TValue extends GroupValue<TControls>,
> = {
  className?: string;
  form: ReactFormControl<TControls, TValue>;
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
