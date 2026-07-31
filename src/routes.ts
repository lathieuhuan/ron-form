import PastJobs from "./features/past-jobs";
import PersonalInfo from "./features/personal-info";
import Register from "./features/register";
import { Route } from "./types";

export const routes: Route[] = [
  {
    label: "Register Form",
    path: "/register",
    Component: Register,
  },
  {
    label: "Personal Info Form",
    path: "/personal-info",
    Component: PersonalInfo,
  },  
  {
    label: "Past Jobs Form",
    path: "/past-jobs",
    Component: PastJobs,
  },
];
