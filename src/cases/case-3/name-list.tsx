import { ItemControl } from "@lib/core";
import { FormList } from "@lib/react";
import { Button } from "@src/components/Button";
import { Item } from "./item";

export function NameList() {
  return (
    <FormList<ItemControl<string>> name={["names"]}>
      {(items, { removeItem, insertItem }) => (
        <div className="flex flex-col gap-4">
          <p>Names</p>

          <div className="space-y-2 empty:hidden">
            {items.map(({ id, control }, index) => {
              return (
                <Item
                  key={id}
                  label={`Name ${index + 1}`}
                  control={control}
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
