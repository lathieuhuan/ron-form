import { FormControl, ItemControl, ListControl, makeRequiredValidator } from "@lib/core";
import { useMemo } from "react";

import { CaseLayout, CaseLayoutWatchConfig } from "@src/components/CaseLayout";
import { NameList } from "./name-list";
import { RoleList } from "./role-list";

export function Case3() {
  const form = useMemo(() => {
    const namesControl = new ListControl(
      new ItemControl<string>(undefined, {
        validators: [makeRequiredValidator()],
      }),
    );

    const rolesControl = new ListControl(
      new ItemControl<string>(undefined, {
        validators: [makeRequiredValidator()],
      }),
    );

    return new FormControl({
      names: namesControl,
      roles: rolesControl,
    });
  }, []);

  const watchConfigs: CaseLayoutWatchConfig[] = [
    {
      title: "Names",
      control: form.getControl(["names"]),
    },
    {
      title: "Role",
      control: form.getControl(["roles"]),
    },
    {
      title: "Form root",
      control: form,
    },
  ];

  return (
    <CaseLayout
      form={form}
      description={
        <ul>
          <li>Simple form list with required string fields.</li>
          {/* <li>Items can be rendered in 2 ways: with NamePath or with Control.</li> */}
        </ul>
      }
      watchConfigs={watchConfigs}
    >
      <div className="space-y-4">
        <NameList />
        <div className="bg-border opacity-50 w-full h-px" />
        <RoleList />
      </div>
    </CaseLayout>
  );
}
