import { useFormField } from "@lib/react";
import { renderInputField, renderSelectField } from "@src/utils/form.utils";
import { CITY_OPTIONS, DISTRICT_OPTIONS, WARD_OPTIONS } from "./constants";
import { Field, useForm, useFormOptions } from "./context";

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

  return (
    <Layout form={form}>
      <div className="grid grid-cols-2 gap-4">
        <Field name="name">
          {renderInputField(({ fieldProps, inputProps }) => (
            <FormField label="Name" {...fieldProps}>
              <Input {...inputProps} />
            </FormField>
          ))}
        </Field>

        <Field name="citizenId">
          {renderInputField(({ fieldProps, inputProps }) => (
            <FormField label="Citizen ID" {...fieldProps}>
              <Input {...inputProps} />
            </FormField>
          ))}
        </Field>

        <Field name="address.city">
          {renderSelectField(({ fieldProps, selectProps }) => (
            <FormField label="City" {...fieldProps}>
              <Select
                options={CITY_OPTIONS}
                {...selectProps}
                onChange={(value) => {
                  form.setFieldValue("address.district", "");
                  form.setFieldValue("address.ward", "");
                  selectProps.onChange(value);
                }}
              />
            </FormField>
          ))}
        </Field>

        <Field name="address.district">
          {renderSelectField(({ fieldProps, selectProps }) => (
            <FormField label="District" {...fieldProps}>
              <Select
                options={DISTRICT_OPTIONS}
                disabled={!cityField.value}
                {...selectProps}
                onChange={(value) => {
                  form.setFieldValue("address.ward", "");
                  selectProps.onChange(value);
                }}
              />
            </FormField>
          ))}
        </Field>

        <Field name="address.district">
          {({ value: districtValue }) => (
            <Field name="address.ward">
              {renderSelectField(({ fieldProps, selectProps }) => (
                <FormField label="Ward" {...fieldProps}>
                  <Select options={WARD_OPTIONS} disabled={!districtValue} {...selectProps} />
                </FormField>
              ))}
            </Field>
          )}
        </Field>

        <Field name="address.street">
          {renderInputField(({ fieldProps, inputProps }) => (
            <FormField label="Street" {...fieldProps}>
              <Input {...inputProps} />
            </FormField>
          ))}
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
