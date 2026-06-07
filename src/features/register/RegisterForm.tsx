import { Field, Form, useForm } from "./context";

import { Button } from "@src/components/Button";
import { FormLabel } from "@src/components/Form";
import { Input } from "@src/components/Input";

export function RegisterForm() {
  const form = useForm({
    defaultValue: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLog = () => {
    console.log(form.values);
    console.log(form.meta);
  };

  return (
    <div className="max-w-66 p-4 space-y-4">
      <h1 className="text-2xl font-bold">Register Form</h1>

      <div className="space-y-4">
        <Form form={form}>
          <Field name="username">
            {(field) => (
              <div>
                <FormLabel htmlFor={field.name}>Username</FormLabel>
                <Input
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </div>
            )}
          </Field>

          <Field name="password">
            {(field) => (
              <div>
                <FormLabel htmlFor={field.name}>Password</FormLabel>
                <Input
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </div>
            )}
          </Field>

          <Field name="confirmPassword">
            {(field) => (
              <div>
                <FormLabel htmlFor={field.name}>Confirm Password</FormLabel>
                <Input
                  id={field.name}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </div>
            )}
          </Field>
        </Form>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleLog}>
          Log
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </div>
  );
}
