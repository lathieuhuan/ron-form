import { useFormSupervisor } from "./context";

interface FieldSelectorProps {
  name: string;
  children: React.ReactNode;
}

export function FieldSelector({ name, children }: FieldSelectorProps) {
  const { setWatchedField } = useFormSupervisor();

  return <div onClick={() => setWatchedField(name)}>{children}</div>;
}
