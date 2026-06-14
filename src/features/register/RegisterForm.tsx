import { Field, useForm, useFormOptions } from "./context";

import { Button } from "@src/components/Button";
import { Input } from "@src/components/Input";
import { FormField } from "@src/components/form";
import { Layout } from "./Layout";

export function RegisterForm() {
  const form = useForm(useFormOptions);

  const handleLog = () => {
    console.log(form.values);
  };

  return (
    <Layout form={form}>
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
    </Layout>
  );
}
