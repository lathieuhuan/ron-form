import { FieldState } from "@lib/core";
import { useEffect, useState } from "react";
import { useFormTester } from "./context";
import { Divider } from "@src/components/Divider";

export function FieldWatcher() {
  const { form, watchedField } = useFormTester();
  const [field, setField] = useState<FieldState<any, any> | null>(null);

  useEffect(() => {
    if (!watchedField) return;

    setField(form.getFieldState(watchedField));

    return form.subscribeField(watchedField, (state) => {
      console.log("state", state);
      setField(state);
    });
  }, [form, watchedField]);

  if (!field) {
    return <div className="w-100 bg-black/20 rounded-md p-3">No field selected</div>;
  }

  return (
    <div className="min-w-100 w-fit bg-black/20 rounded-md p-3">
      <p className="mb-3 text-sm font-bold">{watchedField}</p>

      <div className="space-y-2">
        <div>
          <p className="text-primary">Value</p>
          <pre>{JSON.stringify(field.value, null, 2)}</pre>
        </div>

        <Divider direction="horizontal" />

        <div>
          <p className="text-primary">Meta</p>
          <pre>{JSON.stringify(field.meta, null, 2)}</pre>
        </div>

        <Divider direction="horizontal" />

        <div>
          <p className="text-primary">Errors</p>
          <pre>{JSON.stringify(field.errorMap, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
