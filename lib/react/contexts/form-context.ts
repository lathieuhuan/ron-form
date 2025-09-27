import { createContext } from "react";
import { BaseControl, ItemControl } from "@lib/core";

export const FormContext = createContext<BaseControl<unknown>>(new ItemControl<unknown>());
