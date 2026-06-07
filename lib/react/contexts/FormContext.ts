import { createContext } from "react";
import { FormControl } from "@lib/core/FormControl";

export const FormContext = createContext<FormControl<any>>(new FormControl<any>());
