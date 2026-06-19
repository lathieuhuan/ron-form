import { ReactFieldStrictApi } from "@lib/react";
import { CITY_OPTIONS, DISTRICT_OPTIONS, WARD_OPTIONS } from "./config";
import { AddressFormValues, Field, useForm, useFormOptions } from "./context";

import { Button } from "@src/components/Button";
import { Input } from "@src/components/Input";
import { Select } from "@src/components/Select";
import { FormField } from "@src/components/form";
import { Layout } from "./Layout";

export function AddressForm() {
  const form = useForm(useFormOptions);

  const handleLog = () => {
    console.log(form.values);
  };

  const handleSelectOpenChange = (open: boolean, field: ReactFieldStrictApi<AddressFormValues>) => {
    if (open) {
      form.setFieldMeta(field.name, (meta) => ({
        ...meta,
        isTouched: true,
      }));
    } else {
      field.handleBlur();
    }
  };

  return (
    <Layout form={form}>
      <div className="grid grid-cols-2 gap-4">
        <Field name="street">
          {(field) => (
            <FormField label="Street" field={field}>
              <Input />
            </FormField>
          )}
        </Field>

        <Field name="city">
          {(field) => (
            <FormField label="City" field={field}>
              <Select
                options={CITY_OPTIONS}
                onOpenChange={(open) => handleSelectOpenChange(open, field)}
              />
            </FormField>
          )}
        </Field>

        <Field name="district">
          {(field) => (
            <FormField label="District" field={field}>
              <Select
                options={DISTRICT_OPTIONS}
                onOpenChange={(open) => handleSelectOpenChange(open, field)}
              />
            </FormField>
          )}
        </Field>

        <Field name="ward">
          {(field) => (
            <FormField label="Ward" field={field}>
              <Select
                options={WARD_OPTIONS}
                onOpenChange={(open) => handleSelectOpenChange(open, field)}
              />
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
