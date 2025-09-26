import { createContext } from "react";

import { ItemControl } from "@lib/core/controls/ItemControl";
import { ReactBaseControl } from "../types";

export const FormContext = createContext<ReactBaseControl<any>>(new ItemControl<any>());
