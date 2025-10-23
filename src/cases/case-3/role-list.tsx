import { ItemControl } from "@lib/core";
import { FormList } from "@lib/react";
import { Button } from "@src/components/Button";
import { Item } from "./item";

export function RoleList() {
  return (
    <FormList<ItemControl<string>> name={["roles"]}>
      {(items, { removeItem, insertItem }) => (
        <div className="flex flex-col gap-4">
          <p>Roles</p>

          <div className="space-y-2 empty:hidden">
            {items.map(({ id }, index) => {
              return (
                <Item
                  key={id}
                  label={`Role ${index + 1}`}
                  name={[index]}
                  onRemove={() => removeItem(id)}
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
