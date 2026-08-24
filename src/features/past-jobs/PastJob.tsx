import { TrashIcon } from "lucide-react";

import { Button } from "@src/components/Button";
import { FormField } from "@src/components/form/FormField";
import { Input } from "@src/components/Input";
import { InputNumber } from "@src/components/InputNumber";
import { renderInputField } from "@src/utils/form.utils";
import { Field } from "./context";

export function PastJob({ index, onRemove }: { index: number; onRemove: () => void }) {
  return (
    <div className="p-4 rounded-md bg-black/10 grid grid-cols-2 gap-4">
      <Field name={`pastJobs.${index}.companyName`}>
        {renderInputField(({ inputProps }) => (
          <Input className="w-full" {...inputProps} />
        ))}
      </Field>

      <div className="flex justify-end items-center">
        <Button variant="destructive" size="icon" onClick={onRemove}>
          <TrashIcon />
        </Button>
      </div>

      <Field name={`pastJobs.${index}.level`}>
        {renderInputField(({ fieldProps, inputProps }) => (
          <FormField label="Level" {...fieldProps}>
            <Input {...inputProps} />
          </FormField>
        ))}
      </Field>

      <Field name={`pastJobs.${index}.startYear`}>
        {renderInputField(({ fieldProps, inputProps }) => (
          <FormField label="Start Year" {...fieldProps}>
            <InputNumber {...inputProps} />
          </FormField>
        ))}
      </Field>
    </div>
  );
}
