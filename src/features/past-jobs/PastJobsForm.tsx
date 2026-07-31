import { useMemo, useRef } from "react";

import { fieldArray, useFieldArrayValue } from "@lib/react";
import { renderInputField, selectFieldProps } from "@src/utils/form.utils";
import { DEFAULT_PAST_JOB_PROPS } from "./constants";
import { Field, useForm, useFormOptions } from "./context";

import { Button } from "@src/components/Button";
import { FormField } from "@src/components/form";
import { Input } from "@src/components/Input";
import { InputNumber } from "@src/components/InputNumber";
import { RenderIndicator } from "@src/components/RenderIndicator";
import { Layout } from "./Layout";

export function PastJobsForm() {
  const form = useForm(useFormOptions);
  const nextId = useRef(1);

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

  const handleAddPastJob = () => {
    pastJobsApi.insert({
      id: `${nextId.current++}`,
      ...DEFAULT_PAST_JOB_PROPS,
    });
  };

  const handleClear = () => {
    form.setFieldValue("pastJobs", []);
  };

  return (
    <Layout form={form}>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleAddPastJob}>
          Add
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>

        <Button variant="outline" className="ml-auto" onClick={form.reset}>
          Reset
        </Button>
        <Button type="submit" onClick={form.handleSubmit}>
          Submit
        </Button>
      </div>

      <RenderIndicator>
        <div className="max-h-[70vh] overflow-y-auto space-y-2 peer">
          {pastJobs.map((pastJob, index) => (
            <div key={pastJob.id} className="p-4 rounded-md bg-black/10 grid grid-cols-2 gap-4">
              <p className="text-lg font-medium">Job {index + 1}</p>

              <div className="flex justify-end items-center">
                <Button variant="destructive" size="sm" onClick={() => pastJobsApi.remove(index)}>
                  Remove
                </Button>
              </div>

              <Field name={`pastJobs.${index}.companyName`}>
                {renderInputField(({ fieldProps, inputProps }) => (
                  <FormField label="Company Name" {...fieldProps}>
                    <Input {...inputProps} />
                  </FormField>
                ))}
              </Field>

              <Field name={`pastJobs.${index}.startYear`}>
                {renderInputField(({ fieldProps, inputProps }) => (
                  <FormField label="Start Date" {...fieldProps}>
                    <InputNumber {...inputProps} />
                  </FormField>
                ))}
              </Field>
            </div>
          ))}
        </div>

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
