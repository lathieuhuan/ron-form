import { renderInputField } from "@src/utils/form.utils";
import { Field, useForm, useFormOptions } from "./context";

import { Button } from "@src/components/Button";
import { Input } from "@src/components/Input";
import { RenderIndicator } from "@src/components/RenderIndicator";
import { FormField } from "@src/components/form";
import { Layout } from "./Layout";

export function RegisterForm() {
  const form = useForm(useFormOptions);

  const handleLog = () => {
    console.log(form.values);
  };

  return (
    <Layout form={form}>
      <div className="grid grid-cols-2 gap-4">
        <Field name="email">
          {renderInputField(({ fieldProps, inputProps }) => (
            <RenderIndicator>
              <FormField label="Email" {...fieldProps}>
                <Input {...inputProps} />
              </FormField>
            </RenderIndicator>
          ))}
        </Field>

        <Field name="username">
          {renderInputField(({ fieldProps, inputProps }) => (
            <RenderIndicator>
              <FormField label="Username" {...fieldProps}>
                <Input {...inputProps} />
              </FormField>
            </RenderIndicator>
          ))}
        </Field>

        <Field name="password">
          {renderInputField(({ fieldProps, inputProps }) => (
            <FormField label="Password" {...fieldProps}>
              <Input {...inputProps} />
            </FormField>
          ))}
        </Field>

        <Field name="confirmPassword">
          {renderInputField(({ fieldProps, inputProps }) => (
            <FormField label="Confirm Password" {...fieldProps}>
              <Input {...inputProps} />
            </FormField>
          ))}
        </Field>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleLog}>
          Log
        </Button>
        <Button type="submit" onClick={form.handleSubmit}>
          Submit
        </Button>
      </div>
    </Layout>
  );
}
