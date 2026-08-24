import { useMemo } from "react";

import { fieldArray, useFieldArrayValue } from "@lib/react";
import { PastJob } from "./PastJob";
import { useFormInstance } from "./context";

export function PastJobs() {
  const form = useFormInstance();

  const pastJobs = useFieldArrayValue({
    form,
    name: "pastJobs",
  });

  const pastJobsApi = useMemo(() => {
    return fieldArray({
      name: "pastJobs",
      form,
    });
  }, [form]);

  return (
    <div className="max-h-[70vh] overflow-y-auto space-y-2 peer">
      {pastJobs.map((pastJob, index) => (
        <PastJob key={pastJob.id} index={index} onRemove={() => pastJobsApi.remove(index)} />
      ))}
    </div>
  );
}
