import { ItemControl } from "@lib/core";
import { FormList } from "@lib/react";
import { Button } from "@src/components/Button";
import { Item } from "./item";

export function NameList() {
  return (
    <FormList<ItemControl<string>> name={["names"]}>
      {(controls, { removeItem, insertItem }) => (
        <div className="flex flex-col gap-4">
          <p>Names</p>

          <div className="space-y-2 empty:hidden">
            {controls.map((control, index) => {
              return (
                <Item
                  key={control.name}
                  label={`Name ${index + 1}`}
                  control={control}
                  onRemove={() => removeItem(control)}
                />
              );
            })}
          </div>

          <div>
            <Button onClick={() => insertItem()}>Add</Button>
          </div>
        </div>
      )}
    </FormList>
  );
}
