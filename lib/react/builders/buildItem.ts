import { ItemControl } from "@lib/core";
import { ReactItemControl } from "../types";

export function buildItem<TValue = unknown>(
  ...args: ConstructorParameters<typeof ItemControl<TValue>>
) {
  return new ItemControl<TValue>(...args) as ReactItemControl<TValue>;
}
