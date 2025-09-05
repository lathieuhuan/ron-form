import { createContext } from "react";
import { BaseControl } from "@lib/core/controls/BaseControl";

export const FormContext = createContext<BaseControl<any> | null>(null);
