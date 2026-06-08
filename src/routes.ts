import Register from "./features/register";
import { Route } from "./types";

export const routes: Route[] = [
  {
    label: "Register Form",
    path: "/register",
    Component: Register,
  },
];
