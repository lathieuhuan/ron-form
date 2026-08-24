import { useMemo, useState } from "react";

import { fieldArray } from "@lib/react";
import { selectFieldProps } from "@src/utils/form.utils";
import { Field, useForm, useFormOptions } from "./context";

import { RenderIndicator } from "@src/components/RenderIndicator";
import { Layout } from "./Layout";
import { PastJobs } from "./PastJobs";
import { ReorderMenu } from "./ReorderMenu";
import { ToolBar } from "./ToolBar";

export function PastJobsForm() {
  const form = useForm(useFormOptions);
  const [reordering, setReordering] = useState(false);

  const pastJobsApi = useMemo(() => {
    return fieldArray({
      name: "pastJobs",
      form,
    });
  }, [form]);

  const handleMoveJob = (fromIndex: number, toIndex: number) => {
    pastJobsApi.move(fromIndex, toIndex);
  };

  return (
    <Layout form={form}>
      <ToolBar onRequestReorder={() => setReordering(!reordering)} />

      <RenderIndicator>
        {reordering ? <ReorderMenu onMove={handleMoveJob} /> : <PastJobs />}

        <div className="py-4 text-center text-sm text-gray-500 hidden peer-empty:block">
          <div>No past jobs</div>
          <Field name="pastJobs">
            {(field) => {
              return <div className="text-red-500">{selectFieldProps(field).error}</div>;
            }}
          </Field>
        </div>
      </RenderIndicator>
    </Layout>
  );
}
