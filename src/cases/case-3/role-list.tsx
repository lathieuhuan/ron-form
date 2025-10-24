import { ItemControl } from "@lib/core";
import { FormList } from "@lib/react";
import { Button } from "@src/components/Button";
import { Item } from "./item";

export function RoleList() {
  return (
    <FormList<ItemControl<string>> name={["roles"]}>
      {(controls, { removeItem, insertItem }) => (
        <div className="flex flex-col gap-4">
          <p>Roles</p>

          <div className="space-y-2 empty:hidden">
            {controls.map((control, index) => {
              return (
                <Item
                  key={control.name}
                  label={`Role ${index + 1}`}
                  name={[index]}
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
