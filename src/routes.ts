import { Case1 } from "./cases/case-1";
import { Case2 } from "./cases/case-2";
import { Case3 } from "./cases/case-3";
import { Route } from "./types";

export const routes: Route[] = [
  {
    label: "Case 1",
    path: "/case-1",
    Component: Case1,
  },
  {
    label: "Case 2",
    path: "/case-2",
    Component: Case2,
  },
  {
    label: "Case 3",
    path: "/case-3",
    Component: Case3,
  },
];
