import { FieldChildrenProps } from "@lib/react";
import { FieldError, FieldLabel } from "@src/components/Field";
import { cloneElement } from "react";

type FormFieldProps = {
  label: string;
  field: FieldChildrenProps<object, string>;
  children: React.ReactElement;
};

export function FormField({ label, field, children }: FormFieldProps) {
  return (
    <div>
      <FieldLabel htmlFor={field.id}>{label}</FieldLabel>
      {cloneElement(children, {
        id: field.id,
        name: field.name,
        value: field.value,
        onChange: field.onChange,
      })}
      <FieldError>{field.errors.map((error) => error.message).join(", ")}</FieldError>
    </div>
  );
}
