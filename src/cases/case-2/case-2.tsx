import { FormControl, GroupControl, ItemControl, REQUIRED } from "@lib";
import { FormItem } from "@lib/react";
import { useEffect, useMemo } from "react";

import { CaseAction, CaseLayout } from "@src/components/case-layout";
import { FormField } from "@src/components/form-field";
import { Input } from "@src/components/input";
import { Select } from "@src/components/select";
import { ROLE_OPTIONS } from "./case-constants";
import { ERole } from "./case-types";
import { careerValidator, numberValidator, roleValidator } from "./case-validators";

export function Case2() {
  //
  const form = useMemo(() => {
    return new FormControl({
      career: new GroupControl(
        {
          role: new ItemControl(ERole.DESIGNER, [REQUIRED], [roleValidator]),
          yoe: new ItemControl(null, [REQUIRED, numberValidator]),
        },
        careerValidator,
      ),
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

  const watchConfigs = [
    {
      title: "Role",
      control: form.getControl(["career", "role"]),
    },
    {
      title: "Career",
      control: form.getControl(["career"]),
    },
  ];

  return (
    <CaseLayout
      form={form}
      description={
        <ul>
          <li>Nested form.</li>
          <li>Async validation on "role": Manager is not available.</li>
          <li>
            Validation on "career": Role Developer requires at least 3 YOE. Role Manager requires at
            least 5 YOE.
          </li>
        </ul>
      }
      watchConfigs={watchConfigs}
    >
      <FormField label="Role" name={["career", "role"]}>
        {(state) => {
          return (
            <FormItem name={["career", "role"]}>
              <Select isError={state.isError} isLoading={state.isPending}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </FormItem>
          );
        }}
      </FormField>

      <FormField label="YOE" name={["career", "yoe"]}>
        {(state) => {
          return (
            <FormItem name={["career", "yoe"]}>
              <Input isError={state.isError} />
            </FormItem>
          );
        }}
      </FormField>

      <CaseAction
        description="Set invalid value to YOE"
        onClick={() => form.setFieldValue(["career", "yoe"], "abc")}
      />
      <CaseAction
        description="Set value to career"
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
      <CaseAction description="Reset career" onClick={() => form.resetField(["career"])} />
    </CaseLayout>
  );
}
