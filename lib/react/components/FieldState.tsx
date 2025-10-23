import { BaseControl, ControlState, NamePath } from "@lib/core";
import { useFieldState } from "../hooks";

type FieldStateProps = {
  name?: NamePath;
  control?: BaseControl;
  children: (state: ControlState) => JSX.Element;
};

export function FieldState({ name = [], control, children }: FieldStateProps) {
  const state = useFieldState(name, control);
  return children(state);
}
