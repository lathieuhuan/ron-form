import { makeRequiredValidator, r } from "@lib/core";
import { FormItem } from "@lib/react";
import { useEffect, useMemo, useState } from "react";

import { CaseAction, CaseLayout } from "@src/components/CaseLayout";
import { FormField } from "@src/components/FormField";
import { Input } from "@src/components/Input";

const requiredValidator = makeRequiredValidator<string>();

export function Case1() {
  const form = useMemo(() => {
    return r.form(
      {
        username: r.item("initial", {
          validators: [requiredValidator],
          id: "username",
        }),
      },
      {
        id: "root",
      },
    );
  }, []);

  const [validate, setValidate] = useState(false);

  const validateStatus = validate ? "true" : "false";

  useEffect(() => {
    return form.subscribeSubmit((result) => {
      if (result.status === "success") {
        console.log(result.value);
      }

      alert(`Form submitted: ${result.status}`);
    });
  }, [form]);

  return (
    <CaseLayout
      form={form}
      description={
        <ul>
          <li>Basic form with 1 simple field.</li>
          <li>Wiring between FormItem and IO elements.</li>
          <li>Get, set, and reset field value. Reset field.</li>
          <li>Required validation. Remove & add validator.</li>
          <li>Submit. Programmatically submit.</li>
        </ul>
      }
      watchConfigs={[
        {
          title: "username",
          control: form.getControl(["username"]),
        },
        {
          title: "FORM",
          control: form,
        },
      ]}
    >
      <FormField label="Username" name={["username"]}>
        {({ control, field }) => {
          return (
            <FormItem control={control}>
              <Input type="text" {...field} />
            </FormItem>
          );
        }}
      </FormField>

      <CaseAction
        description="Get and alert value"
        onClick={() => alert(form.getFieldValue(["username"]))}
      />
      <CaseAction
        description="Toggle validate on set value & reset"
        onClick={() => setValidate(!validate)}
      />
      <CaseAction
        description={`Set value to undefined (validate: ${validateStatus})`}
        onClick={() => {
          form.setFieldValue(["username"], undefined, { validate });
        }}
      />
      <CaseAction
        description="Validate and log errors"
        onClick={() => {
          console.log(form.validateField(["username"]));
        }}
      />
      <CaseAction
        description="Remove validation"
        onClick={() => {
          form.getControl(["username"]).removeValidator(requiredValidator);
        }}
      />
      <CaseAction
        description="Add validation"
        onClick={() => {
          form.getControl(["username"]).addValidator(requiredValidator);
        }}
      />
      {/* Check resetValue and reset again and write tests for them */}
      {/* <CaseAction
        description={`Reset value (validate: ${validateStatus})`}
        onClick={() => form.resetFieldValue(["username"], { validate })}
      /> */}
      {/* <CaseAction
        description={`Reset (validate: ${validateStatus})`}
        onClick={() => form.resetField(["username"])}
      /> */}
      <CaseAction description="Programmatically submit" onClick={() => form.submit()} />
    </CaseLayout>
  );
}
