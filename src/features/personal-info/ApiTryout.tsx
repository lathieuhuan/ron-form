import { FormApi } from "@lib/core";
import { Button } from "@src/components/Button";
import { VALID_CITIZEN_ID } from "./constants";
import { PersonalInfoFormValues } from "./context";

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
      label: "Set 'Name' meta to { isTouched: true }",
      fn: () => form.setFieldMeta("name", (meta) => ({ ...meta, isTouched: true })),
    },
    {
      label: "Validate sync (change) 'Name' (also touch & blur)",
      fn: () =>
        form.validateSync("name", "change", {
          shouldTouch: true,
          shouldBlur: true,
        }),
    },
    {
      label: "Set 'Citizen ID' to the valid value",
      fn: () => form.setFieldValue("citizenId", VALID_CITIZEN_ID),
    },
    {
      label: "Validate async (blur) 'Citizen ID'",
      fn: () => form.validateAsync("citizenId", "blur"),
    },
    {
      label: "Validate sync (change) 'District' but no validator",
      fn: () => form.validateSync("address.district", "change"),
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
