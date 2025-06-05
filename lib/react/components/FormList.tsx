import { useEffect, useState } from "react";

import { ListControl } from "@lib/core/list_control";
import { NamePath } from "@lib/core/types";
import { useControl } from "../hooks/useControl";
import { ReactBaseControl } from "../types";
import { BaseControl } from "@lib/core/base_control";

type ReactListItemControl<
  TValue = unknown,
  TControl extends ReactBaseControl<TValue> = ReactBaseControl<TValue>,
> = {
  id: number;
  control: TControl;
};

type ChildrenRenderProps<
  TValue = unknown,
  TControl extends ReactBaseControl<TValue> = ReactBaseControl<TValue>,
> = {
  items: ReactListItemControl<TValue, TControl>[];
  insert: ListControl["insertItem"];
  remove: ListControl["removeItem"];
};

type FormListProps<TValue, TControl extends ReactBaseControl<TValue>> = {
  name?: NamePath;
  children: (props: ChildrenRenderProps<TValue, TControl>) => JSX.Element;
};

export function FormList<TValue, TControl extends ReactBaseControl<TValue>>({
  name = [],
  children,
}: FormListProps<TValue, TControl>) {
  const control = useControl(name) as ListControl<TValue, BaseControl<TValue>>;
  const [items, setItems] = useState(control.items);

  useEffect(() => {
    if (control instanceof ListControl) {
      return control.subscribeList((items) => setItems(items.concat()));
    }
    return () => {};
  }, [control]);

  return children({
    items: items as unknown as ReactListItemControl<TValue, TControl>[],
    insert: (index: number) => {
      control.insertItem(index);
    },
    remove: (index: number) => {
      control.removeItem(index);
    },
  });
}
