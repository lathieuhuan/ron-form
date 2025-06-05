import { createContext } from "react";
import { BaseControl } from "@lib/core/base_control";

export const FormContext = createContext<BaseControl<any> | null>(null);
