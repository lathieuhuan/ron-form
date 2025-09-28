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
        role: r.item(ERole.DEVELOPER, {
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
      title: "YoE",
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
          <li>Form with 2 fields, YoE starts with invalid value.</li>
          <li>Async validation on "role": Designer is not available.</li>
          <li>
            Validation on the whole form: Role Developer requires at least 3 YoE. Role Manager
            requires at least 5 YoE.
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

        <FormField label="YoE" name={["yoe"]}>
          {({ control, field }) => {
            return (
              <FormItem control={control}>
                <Input {...field} />
              </FormItem>
            );
          }}
        </FormField>
      </div>

      <CaseAction
        description="Set invalid value to YoE and validate"
        onClick={() => form.setFieldValue(["yoe"], "abc", { validate: true })}
      />
      <CaseAction
        description="Set form values to: Manager, 3 YoE"
        onClick={() => form.setValue({ role: ERole.MANAGER, yoe: "3" })}
      />
      <CaseAction description="Validate YoE" onClick={() => form.validateField(["yoe"])} />
      <CaseAction description="Reset form" onClick={() => form.reset()} />
    </CaseLayout>
  );
}
