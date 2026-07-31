import type { PastJob } from "./context";

export const DEFAULT_PAST_JOB_PROPS: Omit<PastJob, "id"> = {
  companyName: "",
  startYear: null,
};
