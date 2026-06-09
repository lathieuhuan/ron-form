import { type FieldError } from "@lib/core";
import { Field, Form, useForm } from "./context";

import { Button } from "@src/components/Button";
import { FieldLabel, FieldError as Error } from "@src/components/Field";
import { Input } from "@src/components/Input";
import { InputNumber } from "@src/components/InputNumber";
import { Select } from "@src/components/Select";

async function isEmailAvailable(email: string) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(email !== "asd");
    }, Math.random() * 300);
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

  const formatErrors = (errors: FieldError<string>[]) => {
    return errors.map((error) => error.message).join(", ");
  };

  const handleLog = () => {
    console.log(form.values);
    console.log(form["fieldMetaMap"]);
  };

  return (
    <div className="max-w-120 p-4 space-y-4">
      <h1 className="text-2xl font-bold">Register Form</h1>

      <Form form={form}>
        <div className="grid grid-cols-2 gap-4">
          <Field name="email">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Email</FieldLabel>
                <Input id={field.id} value={field.value} onChange={field.handleChange} />
                {field.meta.isValidating && <div>Validating...</div>}
                <Error>{formatErrors(field.errors)}</Error>
              </div>
            )}
          </Field>
          <Field name="username">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Username</FieldLabel>
                <Input id={field.id} value={field.value} onChange={field.handleChange} />
                <Error>{formatErrors(field.errors)}</Error>
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
                <InputNumber id={field.id} value={field.value} onChange={field.handleChange} />
                <Error>{formatErrors(field.errors)}</Error>
              </div>
            )}
          </Field>

          <Field name="password">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Password</FieldLabel>
                <Input id={field.id} value={field.value} onChange={field.handleChange} />
                <Error>{formatErrors(field.errors)}</Error>
              </div>
            )}
          </Field>

          <Field name="confirmPassword">
            {(field) => (
              <div>
                <FieldLabel htmlFor={field.id}>Confirm Password</FieldLabel>
                <Input id={field.id} value={field.value} onChange={field.handleChange} />
                <Error>{formatErrors(field.errors)}</Error>
              </div>
            )}
          </Field>
        </div>
      </Form>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleLog}>
          Log
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </div>
  );
}
