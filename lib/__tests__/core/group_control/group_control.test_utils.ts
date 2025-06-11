import { requiredValidator } from "@lib/__tests__/test_utils";
import { GroupControl } from "@lib/core/group_control";
import { ItemControl } from "@lib/core/item_control";
import { GroupValue, ValidatorFn } from "@lib/core/types";

export const INITIAL_VALUE_1 = "value";
export const GROUP_ERRORS = { value1: "invalid value 1" };

const groupValidator: ValidatorFn<
  GroupValue<{ value1: ItemControl<string>; value2: ItemControl<string> }>
> = (control) => {
  const valueLength = control.getValue().value1?.length || 0;
  return valueLength >= 3 ? null : GROUP_ERRORS;
};

export function makeValidGroup(validatorsOn?: "group" | "item") {
  if (validatorsOn === "item") {
    return new GroupControl({
      value1: new ItemControl<string>(INITIAL_VALUE_1, {
        validators: [requiredValidator],
      }),
      value2: new ItemControl<string>(),
    });
  }
  if (validatorsOn === "group") {
    return new GroupControl(
      {
        value1: new ItemControl<string>(INITIAL_VALUE_1),
        value2: new ItemControl<string>(),
      },
      {
        validators: [groupValidator],
      },
    );
  }
  return new GroupControl({
    value1: new ItemControl<string>(),
    value2: new ItemControl<string>(),
  });
}

export function makeInvalidGroup(validatorsOn: "group" | "item") {
  if (validatorsOn === "group") {
    return new GroupControl(
      {
        value1: new ItemControl<string>(),
        value2: new ItemControl<string>(),
      },
      {
        validators: [groupValidator],
      },
    );
  }
  return new GroupControl({
    value1: new ItemControl<string>(undefined, {
      validators: [requiredValidator],
    }),
    value2: new ItemControl<string>(),
  });
}
