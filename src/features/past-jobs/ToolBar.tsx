import { useMemo, useRef } from "react";

import { fieldArray } from "@lib/react";
import { Button } from "@src/components/Button";
import { DEFAULT_PAST_JOB_PROPS } from "./constants";
import { useFormInstance } from "./context";

type ToolBarProps = {
  onRequestReorder: () => void;
};

export function ToolBar({ onRequestReorder }: ToolBarProps) {
  const form = useFormInstance();
  const nextId = useRef(1);

  const pastJobsApi = useMemo(() => {
    return fieldArray({
      name: "pastJobs",
      form,
    });
  }, [form]);

  const handleAddPastJob = () => {
    const newPastJobs = pastJobsApi.insert({
      id: `${nextId.current++}`,
      ...DEFAULT_PAST_JOB_PROPS,
    });

    if (newPastJobs === null) {
      console.error("Failed to add past job");
    }
  };

  const handleUpdatePastJobs = () => {
    form.setFieldValue("pastJobs", [
      {
        id: "1",
        companyName: "Company 1",
        level: "Senior",
        startYear: 2020,
      },
      {
        id: "2",
        companyName: "Company 2",
        level: "Mid",
        startYear: 2024,
      },
    ]);
  };

  const handleClear = () => {
    form.setFieldValue("pastJobs", []);
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleAddPastJob}>
          Add
        </Button>
        <Button variant="outline" onClick={onRequestReorder}>
          Reorder
        </Button>
        <Button variant="outline" onClick={handleUpdatePastJobs}>
          Update Past Jobs
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="ml-auto" onClick={form.reset}>
          Reset
        </Button>
        <Button type="submit" onClick={form.handleSubmit}>
          Submit
        </Button>
      </div>
    </div>
  );
}
