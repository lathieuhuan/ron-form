import { createContext } from "react";
import { BaseControl } from "@lib/core/BaseControl";

export const FormContext = createContext<BaseControl<any> | null>(null);
