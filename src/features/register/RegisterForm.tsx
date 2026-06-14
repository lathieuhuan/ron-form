import type { FieldError } from "@lib/core";
import type { ReactFieldLooseApi } from "@lib/react";

import { Field, Form, FormMeta, RegisterFormValues, useForm, useFormOptions } from "./context";

import { Button } from "@src/components/Button";
import { FieldError as Error, FieldLabel } from "@src/components/Field";
import { Input } from "@src/components/Input";
import { InputNumber } from "@src/components/InputNumber";
import { Select } from "@src/components/Select";
import { FormField } from "@src/components/form";
import { FieldWatcher, FormTester } from "@src/lib/form-tester";

export function RegisterForm() {
  const form = useForm(useFormOptions);

  const showErrors = (field: ReactFieldLooseApi<RegisterFormValues>) => {
    return field.meta.isTouched && field.errors.length > 0;
  };

  const formatErrors = (errors: FieldError<string>[]) => {
    return errors.map((error) => error.message).join(", ");
  };

  const handleLog = () => {
    console.log(form.values);
  };

  return (
    <FormTester form={form}>
      <Form form={form}>
        <div className="w-108 p-4 space-y-4">
          <h1 className="text-2xl font-bold">Register Form</h1>

          <div className="grid grid-cols-2 gap-4">
            <Field name="email">
              {(field) => (
                <FormField label="Email" field={field}>
                  <Input />
                </FormField>
              )}
            </Field>

            <Field name="username">
              {(field) => (
                <FormField label="Username" field={field}>
                  <Input />
                </FormField>
              )}
            </Field>

            <Field name="password">
              {(field) => (
                <FormField label="Password" field={field}>
                  <Input />
                </FormField>
              )}
            </Field>

            <Field name="confirmPassword">
              {(field) => (
                <FormField label="Confirm Password" field={field}>
                  <Input />
                </FormField>
              )}
            </Field>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleLog}>
              Log
            </Button>
            <Button type="submit" onClick={form.handleSubmit}>
              Submit
            </Button>
          </div>

          <div>
            <FormMeta>
              {(meta) => (
                <div className="bg-black/20 rounded-md p-3">
                  <p>Form Meta</p>
                  <pre>{JSON.stringify(meta, null, 2)}</pre>
                </div>
              )}
            </FormMeta>
          </div>
        </div>
      </Form>
    </FormTester>
  );
}
