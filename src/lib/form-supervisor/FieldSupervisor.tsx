import { FieldState } from "@lib/core";
import { useEffect, useState } from "react";
import { useFormSupervisor } from "./context";
import { Divider } from "@src/components/Divider";
import { WatchSection } from "./WatchSection";

export function FieldSupervisor() {
  const { form, watchedField } = useFormSupervisor();
  const [field, setField] = useState<FieldState<any, any> | null>(null);

  useEffect(() => {
    if (!watchedField) return;

    setField(form.getFieldState(watchedField));

    return form.subscribeField(watchedField, (state) => {
      setField(state);
    });
  }, [form, watchedField]);

  if (!field) {
    return <div className="w-100 bg-black/20 rounded-md p-3">No field selected</div>;
  }

  return (
    <div className="min-w-100 w-fit bg-black/20 rounded-md p-3">
      <p className="mb-3">
        Field: <span className="font-bold">{watchedField}</span>
      </p>

      <div className="space-y-2">
        <WatchSection title="Value" value={field.value} />

        <Divider direction="horizontal" />

        <WatchSection title="Meta" value={field.meta} />

        <Divider direction="horizontal" />

        <WatchSection title="Errors" value={field.errorMap} />
      </div>
    </div>
  );
}
