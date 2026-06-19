import Register from "./features/register";
import Address from "./features/address";
import { Route } from "./types";

export const routes: Route[] = [
  {
    label: "Register Form",
    path: "/register",
    Component: Register,
  },
  {
    label: "Address Form",
    path: "/address",
    Component: Address,
  },
];
