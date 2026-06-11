import type { FieldError } from "@lib/core";
import type { ReactFieldLooseApi } from "@lib/react";

import { Field, Form, FormMeta, RegisterFormValues, useForm } from "./context";

import { Button } from "@src/components/Button";
import { FieldError as Error, FieldLabel } from "@src/components/Field";
import { Input } from "@src/components/Input";
import { InputNumber } from "@src/components/InputNumber";
import { Select } from "@src/components/Select";

async function isEmailAvailable(email: string) {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(email !== "asd");
      },
      250 + Math.random() * 100,
    );
  });
}

export function RegisterForm() {
  const form = useForm({
    defaultValues: {
      email: "",
      username: "",
      age: 0,
      password: "",
      confirmPassword: "",
    },
    changeValidators: {
      email: ({ value }) => {
        return value.length < 2 ? "Please enter at least 2 characters" : null;
      },
      age: ({ value }) => {
        if (typeof value !== "number" || isNaN(value)) {
          return "Please enter a valid age";
        }

        if (value < 18) {
          return "You must be at least 18 years old to register";
        }

        return null;
      },
    },
    changeAsyncValidators: {
      email: async ({ value }) => {
        const emailAvailable = await isEmailAvailable(value);
        return emailAvailable ? null : "This email is already in use";
      },
    },
  });

  const showErrors = (field: ReactFieldLooseApi<RegisterFormValues>) => {
    return field.meta.isTouched && field.errors.length > 0;
  };

  const formatErrors = (errors: FieldError<string>[]) => {
    return errors.map((error) => error.message).join(", ");
  };

  const handleLog = () => {
    console.log(form.values);
    console.log(form["fieldMetaMap"]);
  };

  return (
    <Form form={form}>
      <div className="max-w-120 p-4 space-y-4">
        <h1 className="text-2xl font-bold">Register Form</h1>

        <div className="grid grid-cols-2 gap-4">
          <Field name="email">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Email</FieldLabel>
                <Input
                  id={field.id}
                  value={field.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                {field.meta.isValidating && <div>Validating...</div>}
                {showErrors(field) && <Error>{formatErrors(field.errors)}</Error>}
              </div>
            )}
          </Field>
          <Field name="username">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Username</FieldLabel>
                <Input
                  id={field.id}
                  value={field.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                {showErrors(field) && <Error>{formatErrors(field.errors)}</Error>}
              </div>
            )}
          </Field>

          <Field name="profession">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Profession</FieldLabel>
                <Select id={field.id} value={field.value} onValueChange={field.handleChange} />
                <Error>{formatErrors(field.errors)}</Error>
              </div>
            )}
          </Field>
          <Field name="age">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Age</FieldLabel>
                <InputNumber
                  id={field.id}
                  value={field.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                {showErrors(field) && <Error>{formatErrors(field.errors)}</Error>}
              </div>
            )}
          </Field>

          <Field name="password">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Password</FieldLabel>
                <Input
                  id={field.id}
                  value={field.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                {showErrors(field) && <Error>{formatErrors(field.errors)}</Error>}
              </div>
            )}
          </Field>

          <Field name="confirmPassword">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Confirm Password</FieldLabel>
                <Input
                  id={field.id}
                  value={field.value}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                />
                {showErrors(field) && <Error>{formatErrors(field.errors)}</Error>}
              </div>
            )}
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleLog}>
            Log
          </Button>
          <Button type="submit">Submit</Button>
        </div>

        <div>
          <FormMeta>
            {(meta) => (
              <div className="bg-black/10 rounded-md p-2">
                <p>Form Meta</p>
                <pre>{JSON.stringify(meta, null, 2)}</pre>
              </div>
            )}
          </FormMeta>
        </div>
      </div>
    </Form>
  );
}
