import { Button } from "@src/components/Button";
import { AddressFormValues } from "./context";
import { FormApi } from "@lib/core";

type TryoutConfig = {
  label: string;
  fn: () => void;
};

type ApiTryoutProps = {
  form: FormApi<AddressFormValues>;
};

export function ApiTryout({ form }: ApiTryoutProps) {
  const tryoutConfigs: TryoutConfig[] = [
    {
      label: "Set 'street' to '123 Main St'",
      fn: () => form.setFieldValue("street", "123 Main St"),
    },
    {
      label: "Set 'street' meta to { isTouched: true }",
      fn: () => form.setFieldMeta("street", (meta) => ({ ...meta, isTouched: true })),
    },
    {
      label: "Reset form",
      fn: () => form.reset(),
    },
  ];

  return (
    <div>
      <p className="mb-3 font-bold">API Tryout</p>

      <div className="space-y-2">
        {tryoutConfigs.map((config, index) => (
          <div key={index} className="flex items-center justify-between">
            <p>{config.label}</p>
            <Button onClick={config.fn}>Click</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
