import { Button } from "@src/components/Button";
import { PersonalInfoFormValues } from "./context";
import { FormApi } from "@lib/core";

type TryoutConfig = {
  label: string;
  fn: () => void;
};

type ApiTryoutProps = {
  form: FormApi<PersonalInfoFormValues>;
};

export function ApiTryout({ form }: ApiTryoutProps) {
  const tryoutConfigs: TryoutConfig[] = [
    {
      label: "Set 'name' to 'John Wick'",
      fn: () => form.setFieldValue("name", "John Wick"),
    },
    {
      label: "Set 'name' meta to { isTouched: true }",
      fn: () => form.setFieldMeta("name", (meta) => ({ ...meta, isTouched: true })),
    },
    {
      label: "Validate 'name' sync (also touch & blur)",
      fn: () =>
        form.validateSync("name", "change", {
          shouldTouch: true,
          shouldBlur: true,
        }),
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
