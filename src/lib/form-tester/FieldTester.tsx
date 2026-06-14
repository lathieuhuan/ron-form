import { useFormTester } from "./context";

interface FieldTesterProps {
  name: string;
  children: React.ReactNode;
}

export function FieldTester({ name, children }: FieldTesterProps) {
  const { setWatchedField } = useFormTester();

  return <div onClick={() => setWatchedField(name)}>{children}</div>;
}
