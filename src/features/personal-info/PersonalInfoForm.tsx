import { ReactFieldStrictApi, useFormField } from "@lib/react";
import { CITY_OPTIONS, DISTRICT_OPTIONS, WARD_OPTIONS } from "./constants";
import { PersonalInfoFormValues, Field, useForm, useFormOptions } from "./context";

import { Button } from "@src/components/Button";
import { Input } from "@src/components/Input";
import { Select } from "@src/components/Select";
import { FormField } from "@src/components/form";
import { Layout } from "./Layout";

export function PersonalInfoForm() {
  const form = useForm(useFormOptions);

  const cityField = useFormField({
    name: "address.city",
    form,
  });

  const handleLog = () => {
    console.log(form.values);
  };

  const handleSelectOpenChange = (
    open: boolean,
    field: ReactFieldStrictApi<PersonalInfoFormValues>,
  ) => {
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
        <Field name="name">
          {(field) => (
            <FormField label="Name" field={field}>
              <Input />
            </FormField>
          )}
        </Field>

        <Field name="citizenId">
          {(field) => (
            <FormField label="Citizen ID" field={field}>
              <Input />
            </FormField>
          )}
        </Field>

        <Field name="address.city">
          {(field) => (
            <FormField label="City" field={field}>
              <Select
                options={CITY_OPTIONS}
                onChange={() => {
                  form.setFieldValue("address.district", "");
                  form.setFieldValue("address.ward", "");
                }}
                onOpenChange={(open) => handleSelectOpenChange(open, field)}
              />
            </FormField>
          )}
        </Field>

        <Field name="address.district">
          {(field) => (
            <FormField label="District" field={field}>
              <Select
                options={DISTRICT_OPTIONS}
                disabled={!cityField.value}
                onChange={() => {
                  form.setFieldValue("address.ward", "");
                }}
                onOpenChange={(open) => handleSelectOpenChange(open, field)}
              />
            </FormField>
          )}
        </Field>

        <Field name="address.district">
          {({ value: districtValue }) => (
            <Field name="address.ward">
              {(field) => (
                <FormField label="Ward" field={field}>
                  <Select
                    options={WARD_OPTIONS}
                    disabled={!districtValue}
                    onOpenChange={(open) => handleSelectOpenChange(open, field)}
                  />
                </FormField>
              )}
            </Field>
          )}
        </Field>

        <Field name="address.street">
          {(field) => (
            <FormField label="Street" field={field}>
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
