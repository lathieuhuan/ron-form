import { r, REQUIRED } from "@lib/core";
import { FormItem } from "@lib/react";
import { useEffect, useMemo } from "react";

import { CaseAction, CaseLayout } from "@src/components/CaseLayout";
import { FormField } from "@src/components/FormField";
import { Input } from "@src/components/Input";

export function Case1() {
  const form = useMemo(() => {
    return r.form({
      username: r.item<string>("initial", {
        validators: [REQUIRED],
      }),
    });
  }, []);

  useEffect(() => {
    return form.subscribeSubmit((result) => {
      if (result.status === "success") {
        console.log("Success");
        console.log(result.value);
      } else {
        console.log("Error");
      }

      alert("Form submitted");
    });
  }, [form]);

  return (
    <CaseLayout
      form={form as any}
      description={
        <ul>
          <li>Basic form with 1 simple field.</li>
          <li>Wiring between FormItem and IO elements.</li>
          <li>Use of useFieldValue & useFieldState in FormField, CaseLayout.</li>
          <li>Get, set, and reset value. Reset field.</li>
          <li>Required validation. Remove & add validation.</li>
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
        {({ itemProps, fieldProps }) => {
          return (
            <FormItem name={itemProps.name}>
              <Input type="text" {...fieldProps} />
            </FormItem>
          );
        }}
      </FormField>

      <CaseAction
        description="Get and log value"
        onClick={() => console.log(form.getFieldValue(["username"]))}
      />
      <CaseAction
        description="Set value to undefined (no validate)"
        onClick={() => form.setFieldValue(["username"], undefined)}
      />
      <CaseAction description="Validate" onClick={() => form.validateField(["username"])} />
      <CaseAction
        description="Remove validation"
        onClick={() => form.getControl(["username"]).removeValidator(REQUIRED)}
      />
      <CaseAction
        description="Add validation"
        onClick={() => form.getControl(["username"]).addValidator(REQUIRED)}
      />
      <CaseAction description="Reset value" onClick={() => form.resetFieldValue(["username"])} />
      <CaseAction description="Reset" onClick={() => form.resetField(["username"])} />
      <CaseAction description="Programmatically submit" onClick={() => form.submit()} />
    </CaseLayout>
  );
}
