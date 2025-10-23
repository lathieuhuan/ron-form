import { ItemControl, NamePath } from "@lib/core";
import { FormItem } from "@lib/react";
import { Button } from "@src/components/Button";
import { FormField } from "@src/components/FormField";
import { Input } from "@src/components/Input";

type ItemProps = {
  label: string;
  name?: NamePath;
  control?: ItemControl<any>;
  onRemove: () => void;
};

export function Item({ label, name, control, onRemove }: ItemProps) {
  return (
    <div className="flex items-start gap-2">
      <FormField label={label} name={name} control={control} className="grow">
        {({ field }) => {
          return (
            <FormItem name={name} control={control}>
              <Input {...field} />
            </FormItem>
          );
        }}
      </FormField>

      <Button className="mt-6" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
