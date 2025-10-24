import { useEffect, useState } from "react";

import { BaseControl, ListControl, ListItemValue, NamePath } from "@lib/core";
import { FormContext } from "../contexts/form-context";
import { useControl } from "../hooks/useControl";

type ListControlOperations<TValue = unknown> = Pick<
  ListControl<BaseControl<TValue>>,
  "insertItem" | "insertItems" | "removeItem" | "clearItems"
>;

type FormListProps<TValue, TControl extends BaseControl<TValue> = BaseControl<TValue>> = {
  name?: NamePath;
  control?: ListControl<TControl>;
  children: (controls: TControl[], operations: ListControlOperations<TValue>) => JSX.Element;
};

export function FormList<
  TChildControl extends BaseControl<any> = BaseControl<any>,
  TValue extends ListItemValue<TChildControl> = ListItemValue<TChildControl>,
>({ name = [], control: controlProp, children }: FormListProps<TValue, TChildControl>) {
  const control = useControl<ListControl<TChildControl, TValue>>(name, controlProp);
  const [controls, setControls] = useState(control.getControls());

  if (!(control instanceof ListControl)) {
    throw new Error("FormList control must be a ListControl");
  }

  useEffect(() => {
    return control.subscribeList((controls) => setControls(controls.concat()));
  }, [control]);

  return (
    <FormContext.Provider value={control as BaseControl<unknown>}>
      {children(controls, {
        insertItem: control.insertItem.bind(control),
        insertItems: control.insertItems.bind(control),
        removeItem: control.removeItem.bind(control),
        clearItems: control.clearItems.bind(control),
      })}
    </FormContext.Provider>
  );
}
