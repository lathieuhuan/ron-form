import { FormApi } from "@lib/core";
import { Form, FormMeta, RegisterFormValues } from "./context";

import { FieldWatcher, FormTester, WatchSection } from "@src/lib/form-tester";

export function Layout(props: { form: FormApi<RegisterFormValues>; children: React.ReactNode }) {
  return (
    <FormTester form={props.form}>
      <Form form={props.form}>
        <div className="p-4 flex gap-4">
          <div className="w-116 space-y-4">
            <h1 className="text-2xl font-bold">Register Form</h1>

            {props.children}

            <Validation />
          </div>

          <div className="space-y-4">
            <FieldWatcher />
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
    </FormTester>
  );
}

function Validation() {
  return (
    <div>
      <p className="mb-3 font-bold">Validation</p>

      <div className="space-y-2">
        <ValidationField
          name="Email"
          rules={[
            {
              trigger: "change",
              message: "Required — trim().lengh > 0",
            },
            {
              trigger: "change",
              message: "At least 3 characters — trim().lengh > 2",
            },
            {
              trigger: "change async",
              message: "Email format — includes('@')",
            },
            {
              trigger: "blur async",
              message: "Already in use — value !== 'qwe'",
            },
          ]}
        />

        <ValidationField
          name="Username"
          rules={[
            {
              trigger: "change",
              message: "Required — trim().lengh > 0",
            },
            {
              trigger: "blur",
              message: "At least 3 characters — trim().lengh > 2",
            },
            {
              trigger: "blur async",
              message: "Already in use — value !== 'asd'",
            },
          ]}
        />
      </div>
    </div>
  );
}

function ValidationField(props: { name: string; rules: { trigger: string; message: string }[] }) {
  return (
    <div>
      <p>{props.name}</p>
      <ul className="list-disc pl-5">
        {props.rules.map((rule) => (
          <li key={`${rule.trigger}-${rule.message}`}>
            <span className="text-primary">[{rule.trigger}]</span> {rule.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
