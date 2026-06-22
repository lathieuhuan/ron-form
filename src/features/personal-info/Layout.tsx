import { FormApi } from "@lib/core";
import { Form, FormMeta, PersonalInfoFormValues } from "./context";

import { FieldSupervisor, FormSupervisor, WatchSection } from "@src/lib/form-supervisor";
import { ApiTryout } from "./ApiTryout";

export function Layout({
  form,
  children,
}: {
  form: FormApi<PersonalInfoFormValues>;
  children: React.ReactNode;
}) {
  return (
    <FormSupervisor form={form}>
      <Form form={form}>
        <div className="h-screen p-4 overflow-y-auto flex gap-4">
          <div className="w-116 space-y-4">
            <h1 className="text-2xl font-bold">Personal Info Form</h1>

            {children}

            <ApiTryout form={form} />
          </div>

          <div className="overflow-y-auto overflow-x-auto space-y-4">
            <FieldSupervisor />
            <FormMeta>
              {(meta) => (
                <WatchSection
                  className="bg-black/20 rounded-md p-3"
                  title="Form Meta"
                  value={meta}
                />
              )}
            </FormMeta>
          </div>
        </div>
      </Form>
    </FormSupervisor>
  );
}
