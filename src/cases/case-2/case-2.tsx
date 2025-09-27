import { r, REQUIRED } from "@lib/core";
import { FormItem } from "@lib/react";
import { useEffect, useMemo } from "react";

import { CaseAction, CaseLayout } from "@src/components/CaseLayout";
import { FormField } from "@src/components/FormField";
import { Input } from "@src/components/Input";
import { Select } from "@src/components/Select";
import { ERole, ROLE_OPTIONS } from "./case-config";
import { careerValidator, numberValidator, roleValidator } from "./case-validators";

export function Case2() {
  //
  const form = useMemo(() => {
    return r.form(
      {
        role: r.item(ERole.DESIGNER, {
          validators: [REQUIRED],
          asyncValidators: [roleValidator],
          id: "role",
        }),
        yoe: r.item<string>("", {
          validators: [REQUIRED, numberValidator],
          id: "yoe",
        }),
      },
      {
        validators: [careerValidator],
        id: "root",
      },
    );
  }, []);

  useEffect(() => {
    return form.subscribeSubmit((result) => {
      if (result.status === "success") {
        console.log(result.value);
      }

      alert(`Form submitted: ${result.status}`);
    });
  }, [form]);

  const watchConfigs = [
    {
      title: "Role",
      control: form.getControl(["role"]),
    },
    {
      title: "YOE",
      control: form.getControl(["yoe"]),
    },
    {
      title: "FORM",
      control: form,
    },
  ];

  return (
    <CaseLayout
      form={form}
      description={
        <ul>
          <li>Form with 2 fields, YOE starts with invalid value.</li>
          <li>Async validation on "role": Manager is not available.</li>
          <li>
            Validation on the whole form: Role Developer requires at least 3 YOE. Role Manager
            requires at least 5 YOE.
          </li>
        </ul>
      }
      watchConfigs={watchConfigs}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Role" name={["role"]}>
          {({ control, field, state }) => {
            return (
              <FormItem control={control} changeEventProp="onValueChange">
                <Select {...field} isLoading={state.isPending} options={ROLE_OPTIONS} />
              </FormItem>
            );
          }}
        </FormField>

        <FormField label="YOE" name={["yoe"]}>
          {({ control, field }) => {
            return (
              <FormItem control={control}>
                <Input {...field} />
              </FormItem>
            );
          }}
        </FormField>
      </div>

      {/* <CaseAction
        description="Set invalid value to YOE"
        onClick={() => form.setFieldValue(["career", "yoe"], "abc")}
      />
      <CaseAction
        description="Set value to career: Manager, 3 YOE"
        onClick={() => form.setFieldValue(["career"], { role: ERole.MANAGER, yoe: 3 })}
      />
      <CaseAction
        description="Validate YOE"
        onClick={() => form.validateField(["career", "yoe"])}
      />
      <CaseAction
        description="Reset career value"
        onClick={() => form.resetFieldValue(["career"])}
      />
      <CaseAction description="Reset career" onClick={() => form.resetField(["career"])} /> */}
    </CaseLayout>
  );
}
