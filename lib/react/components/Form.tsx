import { AnyObject } from "@lib/core/types";
import { FormControl } from "@lib/core/FormControl";
import { FormContext } from "../contexts/FormContext";

export type FormProps<TValue extends AnyObject> = {
  form: FormControl<TValue>;
  children: React.ReactNode;
};

export function Form<TValue extends AnyObject>({ form, children }: FormProps<TValue>) {
  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}
